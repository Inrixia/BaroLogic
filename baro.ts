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
	iterations: 0,
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

	// Setup logging
	LogHelper.NoDelta = false;
	const arcReducer = LogHelper.ReduceHelpers([
		LogHelper.Heading("[== ARC ==]"),
		new LogHelper(() => load, { label: "System Load", units: "kW" }),
		new LogHelper(() => batteryLoad, { label: "Battery Load", units: "kW" }),
		new LogHelper(() => load + batteryLoad, { label: "Total Load", units: "kW" }),
		new LogHelper(({ tick }) => sumLoad / tick, { label: "Average Load", units: "kW" }),
		new LogHelper(() => maxSeenVoltage, { label: "Max Voltage", units: "V", noDelta: true }),
		new LogHelper(({ tick }) => sumVoltage / tick, { label: "Avg Voltage", units: "V", noDelta: true }),
		new LogHelper(() => minSeenVoltage, { label: "Min Voltage", units: "V", noDelta: true }),
	]);
	const logReducer = makeReducer({ reactor, batteries, loadGenerator, extras: [arcReducer], iterReducer });

	const b1 = batteries[0];
	const efficiency = 75;
	const batteryChargeUnits = 100 / b1.maxRechargeSpeed;

	let maxSeenVoltage = 0;
	let sumVoltage = 0;
	let minSeenVoltage = 1;

	let sumLoad = 0;

	const targetVoltage = 1;

	const targetBatteryCharge = 50;

	let load = 0;
	let batteryLoad = 0;
	const ARCTick = () => {
		if (maxSeenVoltage < Powered.Grid.Voltage) maxSeenVoltage = Powered.Grid.Voltage;
		if (maxSeenVoltage > 0 && minSeenVoltage > Powered.Grid.Voltage) minSeenVoltage = Powered.Grid.Voltage;
		sumVoltage += Powered.Grid.Voltage;
		sumLoad += Powered.Grid.Load;

		const realChargeRate = b1.GetChargePercentage() >= 100 ? 0 : b1.GetChargeRate();

		// The current power the batteries are consuming from the grid
		batteryLoad = (realChargeRate / batteryChargeUnits) * batteries.length;

		// Amount of excess power on the grid
		const current = (Powered.Grid.Power - Powered.Grid.Load) / targetVoltage;

		let batteryTargetChargeRate = (current / batteries.length) * batteryChargeUnits;

		let reactorTargetVoltage = targetVoltage;
		let reactorLoadOffset = 0;
		// Batteries have too much charge, reduce reactor output
		if (b1.GetChargePercentage() >= targetBatteryCharge) {
			reactorTargetVoltage *= 0.5;
		}
		// Batteries have too little charge, increase battery charge rate and reactor output
		const distanceToTarget = b1.GetChargePercentage() / targetBatteryCharge;
		if (distanceToTarget < 0.8) {
			const targetChargeRate = (1 - distanceToTarget) * 100;
			batteryTargetChargeRate += targetChargeRate;
			reactorLoadOffset = (targetChargeRate / batteryChargeUnits) * batteries.length;
		}

		// Load the reactor sees and attempts to meet
		load = Math.min((reactor.GetLoadValueOut() - batteryLoad - current) * reactorTargetVoltage, reactor.maxPowerOutput);

		const turbineRate = (load + reactorLoadOffset) / (reactor.maxPowerOutput / 100);
		const currentTurbineRate = reactor.GetPowerValueOut() / (reactor.maxPowerOutput / 100);
		const bangBang = turbineRate < currentTurbineRate ? 0 : turbineRate === currentTurbineRate ? turbineRate : 100;
		reactor.SetTurbineOutput(bangBang);

		const fissionRate = turbineRate / (reactor.GetFuelOut() / efficiency);
		reactor.SetFissionRate(fissionRate);

		// Increase the batteries charge rate to soak up extra power from the grid and keep voltage at target
		setBatteryChargeRate(Math.max(roundToNearestTens(batteryTargetChargeRate, "Up"), 10));
	};

	// Battery helpers;
	const roundToNearestTens = (num: number, dir: "Up" | "Down"): number => {
		if (num % 10 === 0) return num;
		let nearestMultipleOf10 = Math.round(num / 10) * 10;
		return nearestMultipleOf10 + 10 * (dir === "Up" ? 1 : -1);
	};

	const rollingVoltage = new Rolling(2);
	const logic = (simInfo: SimInfo) => {
		let exit = [];
		if (reactor.GetFuelPercentageLeft() <= 0) exit.push("reactor.GetFuelPercentageLeft() <= 0");
		if (reactor.melted) exit.push("reactor.melted");
		if (Powered.Grid.Health <= 0) exit.push("Powered.Grid.Health <= 0");
		if (b1.GetChargePercentage() <= 15) exit.push("b1.GetChargePrecentage() <= 15");
		if (b1.GetChargePercentage() >= 99) exit.push("b1.GetChargePrecentage() >= 99");
		if (rollingVoltage.min(Powered.Grid.Voltage) > 1.9) exit.push("Powered.Grid.Voltage > 2 for 2 ticks");

		ARCTick();

		if (exit.length > 0) {
			console.clear();

			if (iterate) {
				iterInfo.iterations++;
				iterInfo.timeAliveSum += simInfo.time;
				iterInfo.maxSeenVoltage = Math.max(iterInfo.maxSeenVoltage, maxSeenVoltage);
				iterInfo.ticks += simInfo.tick;
				iterInfo.voltageSum += sumVoltage;
			}
			console.log(logReducer(simInfo));
			console.log(`Reason: ${exit.join(", ")}`);
			return SimStatus.Stopped;
		}

		loadGenerator.normalLoad({
			minLoad: 1000,
			maxLoad: b1.maxOutPut * batteries.length + reactor.maxPowerOutput,
			maxLoadSpike: b1.maxOutPut * batteries.length,
			maxAvgLoad: 3000,
			currentAvgLoad: sumLoad / simInfo.tick,
		});

		// Simulate someone repairing the grid occasionally
		// if (simInfo.tick % (simInfo.tickRate * 60) === 0) Powered.Grid.Health = Powered.Grid.MaxHealth;

		// reduce every tick to keep deltas up to date

		if (simInfo.status === SimStatus.RealTime && simInfo.tick % 3 === 0) {
			console.clear();
			console.log(logReducer(simInfo));
		} else if (!iterate) LogHelper.TickHelpers(simInfo);

		// if (exit.length > 0) return SimStatus.RealTime;
	};

	new Simulator({
		simulate: Powered.PoweredList,
		logic,
		type: SimStatus.Endless,
		tickRate: 20,
		simSpeed: 10,
	}).start();

	if (!iterate) break;
}
