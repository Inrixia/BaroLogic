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
import { Reactor } from "./lib/classes/Reactor";
import { Rod, Rods, Quality } from "./lib/classes/FuelRod";
const sleep = promisify(setTimeout);

enum SimType {
	RealTime,
	Timed,
	Endless,
}

const reactorLog = (turbineRate: number, fissionRate: number) => {
	console.clear();
	console.log(`Power: ${reactor.GetPower().toFixed(2)} kW`);
	console.log(`Fuel: ${reactor.GetFuel()}`);
	console.log(`Fuel Percentage Left: ${reactor.GetFuelPercentageLeft().toFixed(2)}%`);
	console.log(`Temperature: ${(reactor.GetTemperature() / 100).toFixed(2)}%`);
	console.log(`Load: ${reactor.GetLoad()} kW`);

	console.log();
	console.log(`Need More Fuel: ${reactor._GetNeedMoreFuel()}`);
	console.log(`Too Much Fuel: ${reactor._GetTooMuchFuel()}`);
	console.log();

	console.log();
	console.log(`[Turbine] - Real: ${reactor._GetTurbineOutput().toFixed(2)}, Set: ${turbineRate.toFixed(2)}`);
	console.log(`[Fission] - Real: ${reactor._GetFissionRate().toFixed(2)}, Set: ${fissionRate.toFixed(2)}`);
	console.log();

	console.log();
	console.log(
		`Rods:${reactor._GetRods().map((rod) => {
			if (rod === null) return ` null`;
			return ` ${((rod.durability / rod.maxDurability) * 100).toFixed(2)}%`;
		})}`
	);
	console.log(`Temperature Critical: ${reactor._GetTemperatureCritical()}`);
	console.log(`Temperature Hot: ${reactor._GetTemperatureHot()}`);
	console.log();
	console.log(`On Fire: ${reactor._GetOnFire() / tickRate}s`);
	console.log(`Melted: ${reactor._GetMelted()}`);
	console.log(`Health: ${reactor._GetHealth()}%`);
	console.log();

	console.log(`Tick: ${tick}, Sec: ${tick / tickRate}`);
};

let tick = 0;
const sim = async (simType: SimType) => {
	const maxTicks = tickRate * simSeconds;
	mainLoop: while (simType !== SimType.Timed || tick <= maxTicks) {
		tick++;
		const [turbineRate, fissionRate] = reactorControllerTick();
		reactor.tick();

		const melted = reactor._GetMelted();

		switch (simType) {
			case SimType.RealTime: {
				reactorLog(turbineRate, fissionRate);
				await sleep(1000 / tickRate);
				break;
			}
			case SimType.Timed: {
				if (tick >= tickRate * simSeconds) reactorLog(turbineRate, fissionRate);
				break;
			}
			case SimType.Endless: {
				// Endless break conditions
				if (reactor.GetFuelPercentageLeft() === 0) {
					reactorLog(turbineRate, fissionRate);
					break mainLoop;
				}
				break;
			}
		}

		if (melted) {
			reactorLog(turbineRate, fissionRate);
			break;
		}
	}
};

const simSeconds = 4 * 60;
const tickRate = 20;
const reactor = new Reactor({
	maxPowerOutput: 5200,
	maxPowerOutputMultiplier: 1,
	rods: [Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal)],
	tickRate,
	reactorMaxHealth: 100,
	fireDelay: 20,
	meltDownDelay: 120,
	fuelConsumptionRate: 0.2,
	playerDegreeOfSuccess: 0,
	powerOn: true,
	autoTemp: false,
});

// reactor._SetLoad(5200);

const reactorControllerTick = (): [setTurbine: number, setFission: number] => {
	const turbineRate = reactor.GetLoad() / (reactor.maxPowerOutput / 100);
	reactor.SetTurbineOutput(turbineRate);
	const fissionRate = turbineRate / (reactor.GetFuel() / rE);
	reactor.SetFissionRate(fissionRate);

	return [turbineRate, fissionRate];
};

sim(SimType.RealTime);
