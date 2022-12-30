import { Reactor } from "./lib/classes/Reactor";
import { Rod, Rods, Quality } from "./lib/classes/FuelRod";
import { PowerContainer } from "./lib/classes/PowerContainer";
import { SimInfo, SimStatus, Simulator } from "./lib/Simulator";
import { Powered } from "./lib/classes/Powered";
import { LoadGenerator } from "./lib/classes/LoadGenerator";
import { LogHelper, makeReducer, IterInfo, IterReducer } from "./lib/logging";
import { Rolling } from "./lib/Rolling";

const iterInfo: IterInfo = {
	timeAliveSum: 0,
	voltageSum: 0,
	ticks: 0,
	maxSeenVoltage: 0,
	minSeenVoltage: Number.MAX_SAFE_INTEGER,
	iterations: 0,
	voltageBlipsSum: 0,
	voltageBlips: 0,
};
const iterReducer = IterReducer(iterInfo);

const iterate = true;

while (true) {
	// Reset Powered
	Powered.Reset();

	// Create Powered objects
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

	const batteries = Array.apply(null, Array(5)).map(() => new PowerContainer({ charge: 1000 }));
	const setBatteryChargeRate = (rate: number) => batteries.map((b) => b.SetChargeRate(rate));

	const loadGenerator = new LoadGenerator();
	const sineGenerator = new LoadGenerator();

	// Setup logging
	LogHelper.NoDelta = false;
	const arcReducer = LogHelper.ReduceHelpers([
		LogHelper.Heading("[== ARC ==]"),
		new LogHelper(() => load, { label: "System Load", units: "kW" }),
		new LogHelper(({ tick }) => sumLoad / tick, { label: "Average Load", units: "kW" }),
		new LogHelper(() => maxSeenVoltage, { label: "Max Voltage", units: "V", noDelta: true }),
		new LogHelper(({ tick }) => sumVoltage / tick, { label: "Avg Voltage", units: "V" }),
		new LogHelper(() => minSeenVoltage, { label: "Min Voltage", units: "V", noDelta: true }),
		new LogHelper(() => voltageBlipsSum / voltageBlips || 0, { label: "Avg Voltage Blip", units: "V" }),
		new LogHelper(() => voltageBlips, { label: "Voltage Blips", noDelta: true }),
	]);
	const logReducer = makeReducer({ reactor, batteries, loadGenerators: [loadGenerator, sineGenerator], extras: [arcReducer], iterReducer: iterate ? iterReducer : undefined });

	const b1 = batteries[0];
	const efficiency = 75;
	const batteryChargeUnits = 100 / b1.maxRechargeSpeed / batteries.length;

	let maxSeenVoltage = 0;
	let sumVoltage = 0;
	let minSeenVoltage = Number.MAX_SAFE_INTEGER;
	let voltageBlips = 0;
	let voltageBlipsSum = 0;

	let sumLoad = 0;

	const targetBatteryCharge = 50;

	const reactorMaxPower = reactor.maxPowerOutput / 100;

	let load = 0;
	const ARCv2 = () => {
		// Reactor Controller

		// The current power the batteries are consuming from the grid
		const batteryLoad = b1.GetChargeRate() / batteryChargeUnits;

		// Load the reactor sees and attempts to meet
		load = Math.min(Powered.Grid.Load - batteryLoad, reactor.maxPowerOutput);

		const turbineRate = load / reactorMaxPower;
		const currentTurbineRate = reactor.GetPowerValueOut() / reactorMaxPower;
		const bangBang = turbineRate < currentTurbineRate ? 0 : 100;
		reactor.SetTurbineOutput(bangBang);

		const fissionRate = turbineRate / (reactor.GetFuelOut() / efficiency);
		reactor.SetFissionRate(fissionRate);

		// Battery Controller

		// Amount of excess power on the grid
		const current = Powered.Grid.Power - Powered.Grid.Load;
		const batteryGridChargeRate = current * batteryChargeUnits;

		// Batteries have too little charge, increase battery charge rate and reactor output
		const batteryFillChargeRage = targetBatteryCharge - b1.GetChargePercentage();

		// Increase the batteries charge rate to soak up extra power from the grid and keep voltage at target
		setBatteryChargeRate(Math.max(roundToNearestTens(Math.max(batteryFillChargeRage, batteryGridChargeRate)), 10));
	};

	// Battery helpers;
	const roundToNearestTens = (num: number): number => Math.round(num / 10) * 10 + 10;

	const rollingVoltage = new Rolling(2);
	const logic = (simInfo: SimInfo) => {
		let exit = [];
		if (reactor.GetFuelPercentageLeft() <= 0) exit.push("reactor.GetFuelPercentageLeft() <= 0");
		if (reactor.melted) exit.push("reactor.melted");
		if (Powered.Grid.Health <= 0) exit.push("Powered.Grid.Health <= 0");
		// if (b1.GetChargePercentage() <= 15) exit.push("b1.GetChargePrecentage() <= 15");
		// if (b1.GetChargePercentage() >= 99) exit.push("b1.GetChargePrecentage() >= 99");
		// if (rollingVoltage.min(Powered.Grid.Voltage) > 1.9) exit.push("Powered.Grid.Voltage > 2 for 2 ticks");
		if (Powered.Grid.Voltage >= 2) {
			voltageBlips++;
			voltageBlipsSum += Powered.Grid.Voltage;
		}

		if (maxSeenVoltage < Powered.Grid.Voltage) maxSeenVoltage = Powered.Grid.Voltage;
		if (maxSeenVoltage > 0 && minSeenVoltage > Powered.Grid.Voltage) minSeenVoltage = Powered.Grid.Voltage;
		sumVoltage += Powered.Grid.Voltage;
		sumLoad += Powered.Grid.Load;

		ARCv2();

		if (exit.length > 0) {
			console.clear();

			if (iterate) {
				iterInfo.iterations++;
				iterInfo.timeAliveSum += simInfo.time;
				iterInfo.maxSeenVoltage = Math.max(iterInfo.maxSeenVoltage, maxSeenVoltage);
				iterInfo.minSeenVoltage = Math.min(iterInfo.minSeenVoltage, minSeenVoltage);
				iterInfo.ticks += simInfo.tick;
				iterInfo.voltageSum += sumVoltage;
				iterInfo.voltageBlipsSum += voltageBlipsSum / voltageBlips;
				iterInfo.voltageBlips += voltageBlips;
			}
			console.log(logReducer(simInfo));
			console.log(`Sim End Reason: ${exit.join(", ")}`);
			return SimStatus.Stopped;
		}

		const meanLoad = {
			minLoad: 500,
			maxLoad: b1.maxRechargeSpeed * batteries.length + reactor.maxPowerOutput,
			maxLoadSpike: 2000,
			maxAvgLoad: 3000,
			currentAvgLoad: sumLoad / simInfo.tick,
		};

		// loadGenerator.normalLoad(meanLoad);

		const sineLoad = {
			minLoad: 500,
			maxLoad: 6000,
			maxLoadSpike: 3000,
			maxAvgLoad: 3000,
			currentAvgLoad: sumLoad / simInfo.tick,
		};

		loadGenerator.normalLoad(sineLoad);
		sineGenerator.sineLoad(0, 2000, simInfo.tick, 1);

		// Simulate someone repairing the grid occasionally
		// if (simInfo.tick % (simInfo.tickRate * 60 * 15) === 0) Powered.Grid.Health = Powered.Grid.MaxHealth;
		// reduce every tick to keep deltas up to date

		if (simInfo.status === SimStatus.RealTime && simInfo.tick % 3 === 0) {
			console.clear();
			console.log(logReducer(simInfo));
		} else if (!iterate) LogHelper.TickHelpers(simInfo);

		if (b1.GetChargePercentage() >= 99.9) return SimStatus.RealTime;
	};

	new Simulator({
		simulate: Powered.PoweredList,
		logic,
		type: SimStatus.Endless,
		tickRate: 20,
		simSpeed: 1,
	}).start();

	if (!iterate) break;
}
