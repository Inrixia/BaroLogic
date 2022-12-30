import { Reactor } from "./lib/classes/Reactor";
import { Rod, Rods, Quality } from "./lib/classes/FuelRod";
import { PowerContainer } from "./lib/classes/PowerContainer";
import { SimInfo, SimStatus, Simulator } from "./lib/Simulator";
import { Powered } from "./lib/classes/Powered";
import { LoadGenerator } from "./lib/classes/LoadGenerator";
import { Clamp } from "./lib/math";
import { ReactorText, MultiBatteryText, GridText, reduceHelpers, LogHelper, Rolling } from "./lib/logging";

const reactor = new Reactor({
	maxPowerOutput: 5200,
	rods: [
		Rod(Rods.VolatileFulgurium, Quality.Masterwork),
		Rod(Rods.VolatileFulgurium, Quality.Masterwork),
		Rod(Rods.VolatileFulgurium, Quality.Masterwork),
		Rod(Rods.VolatileFulgurium, Quality.Masterwork),
	],
	powerOn: true,
	autoTemp: true,
});

const charge = 1000;
const batteries = Array.apply(null, Array(5)).map(() => new PowerContainer({ charge }));

const reactorText = ReactorText(reactor);
const multiBatteryText = MultiBatteryText(batteries);
const gridText = GridText();

LogHelper.NoDelta = false;

const logReducer = reduceHelpers([
	LogHelper.Heading("[== REACTOR ==]"),
	reactorText,
	LogHelper.Newline,
	LogHelper.Heading(`[== BATTERIES x${batteries.length} ==]`),
	multiBatteryText,
	LogHelper.Newline,
	LogHelper.Heading("[== LoadGen ==]"),
	new LogHelper(() => loadGenerator.Load, { label: "Load", units: "kW" }),
	new LogHelper(() => loadGenerator.Power, { label: "Power", units: "kW" }),
	LogHelper.Newline,
	LogHelper.Heading("[== ARC ==]"),
	new LogHelper(() => load, { label: "System Load", units: "kW" }),
	new LogHelper(() => batteryLoad, { label: "Battery Load", units: "kW" }),
	new LogHelper(() => load + batteryLoad, { label: "Total Load", units: "kW" }),
	new LogHelper(() => maxSeenVoltage, { label: "Max Voltage", units: "V", noDelta: true }),
	new LogHelper(({ tick }) => sumVoltage / tick, { label: "Avg Voltage", units: "V", noDelta: true }),
	new LogHelper(() => minSeenVoltage, { label: "Min Voltage", units: "V", noDelta: true }),
	LogHelper.Newline,
	LogHelper.Heading("[== GRID ==]"),
	gridText,
	LogHelper.Newline,
	LogHelper.Heading("[== SIM ==]"),
	reduceHelpers(
		[
			new LogHelper(({ tick }) => tick, { label: "Tick", noDelta: true }),
			new LogHelper(({ time }) => (time / 60).toFixed(0), { label: "Time", units: "m", noDelta: true }),
			new LogHelper(({ time }) => time % 60, { units: "s", noDelta: true }),
			new LogHelper(({ deltaTime }) => deltaTime * 1000, { label: "DeltaTime", units: "ms" }),
		],
		", "
	),
]);
const loadGenerator = new LoadGenerator();

const b1 = batteries[0];

const efficiency = 75;

const batteryChargeUnits = 100 / b1.maxRechargeSpeed;

let maxSeenVoltage = 0;
let sumVoltage = 0;
let minSeenVoltage = 1;

const targetVoltage = 1;
const voltageSlip = 0.2;

const maxExpectedSpike = 2000;

const targetBatteryCharge = 50;

let load = 0;
let batteryLoad = 0;
const ARCTick = () => {
	if (maxSeenVoltage < Powered.Grid.Voltage) maxSeenVoltage = Powered.Grid.Voltage;
	if (maxSeenVoltage > 0 && minSeenVoltage > Powered.Grid.Voltage) minSeenVoltage = Powered.Grid.Voltage;
	sumVoltage += Powered.Grid.Voltage;

	const realChargeRate = b1.GetChargePercentage() >= 100 ? 0 : b1.GetChargeRate();

	batteryLoad = (realChargeRate / batteryChargeUnits) * batteries.length;
	// Reactor
	load = Math.min((reactor.GetLoadValueOut() - batteryLoad) * targetVoltage, reactor.maxPowerOutput);

	const turbineRate = load / (reactor.maxPowerOutput / 100);
	const currentTurbineRate = reactor.GetPowerValueOut() / (reactor.maxPowerOutput / 100);
	reactor.SetTurbineOutput(turbineRate < currentTurbineRate ? 0 : turbineRate === currentTurbineRate ? turbineRate : 100);

	const fissionRate = turbineRate / (reactor.GetFuelOut() / efficiency);
	reactor.SetFissionRate(fissionRate);

	// Batteries
	if (Powered.Grid.Voltage > targetVoltage) {
		const current = (Powered.Grid.Power - Powered.Grid.Load) / targetVoltage;
		setBatteryChargeRate(roundToNearestTensUp((current / batteries.length) * batteryChargeUnits));
	} else {
		setBatteryChargeRate(roundToNearestTensDown(realChargeRate - 10));
	}
};

const roundToNearestTensUp = (num: number): number => {
	if (num % 10 === 0) return num;
	let nearestMultipleOf10 = Math.round(num / 10) * 10;
	return nearestMultipleOf10 + 10;
};

const roundToNearestTensDown = (num: number): number => {
	if (num % 10 === 0) return num;
	let nearestMultipleOf10 = Math.round(num / 10) * 10;
	return nearestMultipleOf10 - 10;
};

const setBatteryChargeRate = (rate: number) => batteries.map((b) => b.SetChargeRate(rate));

const rollingVoltage = new Rolling(2);
const logic = (simInfo: SimInfo) => {
	let exit = [];
	if (reactor.GetFuelPercentageLeft() <= 0) exit.push("reactor.GetFuelPercentageLeft() <= 0");
	if (reactor.melted) exit.push("reactor.melted");
	if (Powered.Grid.Health <= 0) exit.push("Powered.Grid.Health <= 0");
	if (b1.GetChargePercentage() <= 15) exit.push("b1.GetChargePrecentage() <= 15");
	if (b1.GetChargePercentage() >= 99) exit.push("b1.GetChargePrecentage() >= 99");
	if (rollingVoltage.min(Powered.Grid.Voltage) > 2) exit.push("Powered.Grid.Voltage > 2 for 2 ticks");

	ARCTick();

	if (exit.length > 0) {
		console.clear();
		console.log(logReducer(simInfo));
		console.log(`ENDED: ${exit}\n`);
		return SimStatus.Stopped;
	}

	normalLoad();
	// loadGenerator.Load = 10000;

	// Simulate someone repairing the grid occasionally
	if (simInfo.tick % (simInfo.tickRate * 60 * 5) === 0) Powered.Grid.Health = Powered.Grid.MaxHealth;

	// Only log every xs
	const logEvery = simInfo.tick % 3 === 0;
	// reduce every tick to keep deltas up to date
	const log = logReducer(simInfo);

	if (simInfo.status === SimStatus.RealTime && logEvery) {
		console.clear();
		console.log(log);
	}

	// if (exit.length > 0) return SimStatus.RealTime;
};

const normalLoad = () => {
	const minLoad = 1000;
	const maxLoad = 6000;

	const loadLow = loadGenerator.Load <= minLoad + 100;
	const loadHigh = loadGenerator.Load >= maxLoad - 100;

	const sign = loadLow ? 1 : loadHigh ? -1 : Math.random() > 0.5 ? 1 : -1;

	loadGenerator.Load += Math.random() * maxExpectedSpike * sign;
	loadGenerator.Load = Clamp(loadGenerator.Load, minLoad, maxLoad);
};

new Simulator({
	simulate: Powered.PoweredList,
	logic,
	type: SimStatus.Endless,
	tickRate: 20,
	simSpeed: 1,
}).start();
