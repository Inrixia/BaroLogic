import { Reactor } from "./lib/classes/Reactor";
import { Rod, Rods, Quality } from "./lib/classes/FuelRod";
import { PowerContainer } from "./lib/classes/PowerContainer";
import { SimInfo, SimStatus, Simulator } from "./lib/Simulator";
import { Powered } from "./lib/classes/Powered";
import { batteryText, gridText, reactorText } from "./lib/logging";
import { LoadGenerator } from "./lib/classes/LoadGenerator";
import { Clamp } from "./lib/math";

const log = ({ tick, time, tickRate, deltaTime }: SimInfo) => {
	console.clear();
	const txt = `[== REACTOR ==]
${reactorText(reactor, tickRate)}

${batteries.reduce((acc, b, i) => `${acc}[== BATTERY ${i + 1} ==]\n${batteryText(b)}\n`, "")}

[== LoadGen ==]
Previous Load: ${previousLoad.toFixed(2)} kW
Load: ${loadGenerator.Load.toFixed(2)} kW
Power: ${loadGenerator.Power.toFixed(2)} kW

[== ARC ==]
Load: ${load.toFixed(2)} kW
Battery Load: ${batteryLoad.toFixed(2)} kW

Max Seen Voltage: ${maxSeenVoltage.toFixed(2)} V
Avg Voltage: ${(sumVoltage / tick).toFixed(2)} V
Min Seen Voltage: ${minSeenVoltage.toFixed(2)} V

[== GRID ==]
${gridText(tickRate)}

[== SIM ==]
Tick: ${tick}, Sec: ${time.toFixed(2)}s, DeltaTime: ${(deltaTime * 1000).toFixed(2)}ms`;

	console.log(txt);
};

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

const loadGenerator = new LoadGenerator();

const b1 = batteries[0];

const efficiency = 75;

const batteryChargeUnits = 100 / b1.maxRechargeSpeed;

let maxSeenVoltage = 0;
let sumVoltage = 0;
let minSeenVoltage = 1;

const desiredVoltage = 2;

const maxExpectedSpike = 2000;

let load = 0;
let batteryLoad = 0;
const ARCTick = () => {
	if (maxSeenVoltage < Powered.Grid.Voltage) maxSeenVoltage = Powered.Grid.Voltage;
	if (maxSeenVoltage > 0 && minSeenVoltage > Powered.Grid.Voltage) minSeenVoltage = Powered.Grid.Voltage;
	sumVoltage += Powered.Grid.Voltage;

	batteryLoad = (b1.GetChargeRate() / batteryChargeUnits) * batteries.length;
	// Reactor
	// load = Math.min((reactor.GetLoadValueOut() - batteryLoad) * desiredVoltage, reactor.maxPowerOutput);
	load = Math.min(reactor.GetLoadValueOut(), reactor.maxPowerOutput);
	const turbineRate = load / (reactor.maxPowerOutput / 100);
	reactor.SetTurbineOutput(turbineRate);
	reactor.SetFissionRate(turbineRate / (reactor.GetFuelOut() / efficiency));

	// Batteries
	if (b1.GetChargePrecentage() < 15) {
		setBatteryChargeRate(100);
		return;
	}
	const current = (Powered.Grid.Power - Powered.Grid.Load) / 2;
	let desiredDistributedRate = (current / batteries.length) * batteryChargeUnits;

	if (desiredDistributedRate < b1.GetChargeRate()) {
		desiredDistributedRate = b1.GetChargeRate() - 10;
	}

	setBatteryChargeRate(desiredDistributedRate);
};

const setBatteryChargeRate = (rate: number) => batteries.map((b) => b.SetChargeRate(rate));

const logic = (simInfo: SimInfo) => {
	let exit = [];
	if (reactor.GetFuelPercentageLeft() <= 0) exit.push("reactor.GetFuelPercentageLeft() <= 0");
	if (reactor.melted) exit.push("reactor.melted");
	if (Powered.Grid.Health <= 0) exit.push("Powered.Grid.Health <= 0");
	if (b1.GetChargePrecentage() <= 15) exit.push("b1.GetChargePrecentage() <= 15");
	if (Powered.Grid.Voltage > 2) exit.push("Powered.Grid.Voltage > 2");

	if (exit.length > 0) {
		log(simInfo);
		console.log(`ENDED: ${exit}\n`);
		return SimStatus.Stopped;
	}

	ARCTick();

	normalLoad();

	if (simInfo.status === SimStatus.RealTime) log(simInfo);
};

let previousLoad = 0;
const normalLoad = () => {
	previousLoad = loadGenerator.Load;
	const loadLow = loadGenerator.Load <= 1000;
	const loadHigh = loadGenerator.Load >= 10000;

	const sign = loadLow ? 1 : loadHigh ? -1 : Math.random() > 0.5 ? 1 : -1;

	loadGenerator.Load += Math.random() * maxExpectedSpike * sign;
	loadGenerator.Load = Clamp(loadGenerator.Load, 500, 10000);
};

new Simulator({
	simulate: Powered.PoweredList,
	logic,
	type: SimStatus.Endless,
	tickRate: 20,
	simSpeed: 0.1,
}).start();
