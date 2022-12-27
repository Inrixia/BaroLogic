// Num Batteries [1-n]
let bN = 0;
// Battery Charge Rate (KW)
let bC = 0;
// Battery Charge Rage (%)
let bR = 0;

// Main Load (KW)
let lM = 0;
// Load Multiplier [1-2]
let lP = 1;
// Relative Load (KW)
let lR = 0;
// Multiplied Relative Load (KW)
let lX = 0;

// Reactor Max Output (KW) [5200]
const rMAX = 5200;
// Reactor Fuel Efficiency [65-100]
const rE = 75;
// Reactor Fuel
let rF = 0;

import { promisify } from "util";
import { Reactor, Rods } from "./Reactor";
const sleep = promisify(setTimeout);

const tickRate = 20;
const reactor = new Reactor({
	rMax: 5200,
	rods: [Rods.Normal, Rods.Normal, Rods.Normal, Rods.Normal],
	tickRate,
});

reactor.SetLoad(5200);

const reactorControllerTick = (): [setTurbine: number, setFission: number] => {
	const turbineRate = reactor.GetLoad() / (reactor.maxPowerOutput / 100);
	reactor.SetTurbineOutput(turbineRate);
	const fissionRate = turbineRate / (reactor.GetFuel() / rE);
	reactor.SetFissionRate(fissionRate);

	return [turbineRate, fissionRate];
};

const simSeconds = 10;

let tick = 0;
const mainLoop = () => {
	tick++;
	const [turbineRate, fissionRate] = reactorControllerTick();
	reactor.tick();

	console.clear();
	console.log(`Power: ${reactor.GetPower().toFixed(2)} kW`);
	console.log(`Fuel: ${reactor.GetFuel()}`);
	console.log(`Temperature: ${reactor.GetTemperature().toFixed(2)}`);
	console.log(`Load: ${reactor.GetLoad()} kW`);

	console.log();
	console.log(`[Turbine] - Real: ${reactor.GetHiddenTurbineOutput().toFixed(2)}, Set: ${turbineRate.toFixed(2)}`);
	console.log(`[Fission] - Real: ${reactor.GetHiddenFissionRate().toFixed(2)}, Set: ${fissionRate.toFixed(2)}`);
	console.log();

	console.log();
	console.log(`Rods:${reactor.GetRods().map((rod) => ` ${rod?.durability.toFixed(2)}%`)}`);
	console.log(`Temperature Critical: ${reactor.GetTemperatureCritical()}`);
	console.log();

	console.log(`Tick: ${tick}, Sec: ${tick / tickRate}`);

	if (simSeconds > 0) {
		if (tick >= tickRate * simSeconds) return;
		mainLoop();
		return;
	}
	sleep(1000 / tickRate).then(mainLoop);
};
mainLoop();
