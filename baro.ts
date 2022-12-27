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
import { Reactor, Rod, Rods, Quality } from "./Reactor";
const sleep = promisify(setTimeout);

const tickRate = 20;
const reactor = new Reactor({
	rMax: 5200,
	rods: [Rod(Rods.Normal, Quality.Masterwork), Rod(Rods.Normal, Quality.Masterwork), Rod(Rods.Normal, Quality.Masterwork), Rod(Rods.Normal, Quality.Masterwork)],
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

const simSeconds = 4 * 60 + 22;
const realTime = false;

let tick = 0;
while (tick <= tickRate * simSeconds) {
	tick++;
	const [turbineRate, fissionRate] = reactorControllerTick();
	reactor.tick();

	const melted = reactor.GetMelted();

	if (realTime || (!realTime && tick >= tickRate * simSeconds) || melted) {
		console.clear();
		console.log(`Power: ${reactor.GetPower().toFixed(2)} kW`);
		console.log(`Fuel: ${reactor.GetFuel()}`);
		console.log(`Fuel Percentage Left: ${reactor.GetFuelPercentageLeft().toFixed(2)}%`);
		console.log(`Temperature: ${(reactor.GetTemperature() / 100).toFixed(2)}%`);
		console.log(`Load: ${reactor.GetLoad()} kW`);

		console.log();
		console.log(`[Turbine] - Real: ${reactor.GetHiddenTurbineOutput().toFixed(2)}, Set: ${turbineRate.toFixed(2)}`);
		console.log(`[Fission] - Real: ${reactor.GetHiddenFissionRate().toFixed(2)}, Set: ${fissionRate.toFixed(2)}`);
		console.log();

		console.log();
		console.log(
			`Rods:${reactor.GetRods().map((rod) => {
				if (rod === null) return ` null`;
				return ` ${((rod.durability / rod.maxDurability) * 100).toFixed(2)}%`;
			})}`
		);
		console.log(`Temperature Critical: ${reactor.GetTemperatureCritical()}`);
		console.log(`Temperature Hot: ${reactor.GetTemperatureHot()}`);
		console.log();
		console.log(`On Fire: ${reactor.GetOnFire() / tickRate}s`);
		console.log(`Melted: ${reactor.GetMelted()}`);
		console.log(`Health: ${reactor.GetHealth()}%`);
		console.log();

		console.log(`Tick: ${tick}, Sec: ${tick / tickRate}`);
	}

	if (melted) break;

	// sleep(1000 / tickRate).then(mainLoop);
}
