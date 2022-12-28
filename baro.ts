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

import { Reactor } from "./lib/classes/Reactor";
import { Rod, Rods, Quality } from "./lib/classes/FuelRod";
import { PowerContainer } from "./lib/classes/PowerContainer";
import { SimType, Simulator } from "./lib/Simulator";
import { Powered } from "./lib/classes/Powered";

const simSeconds = 4 * 60;
const tickRate = 20;
const reactor = new Reactor({
	maxPowerOutput: 5200,
	maxPowerOutputMultiplier: 1,
	rods: [Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal)],
	reactorMaxHealth: 100,
	fireDelay: 20,
	meltDownDelay: 120,
	fuelConsumptionRate: 0.2,
	playerDegreeOfSuccess: 0,
	powerOn: false,
	autoTemp: false,
});

const battery = new PowerContainer({
	capacityMultiplier: 1,
	capacity: 1000,
	maxRechargeSpeed: 500,
	exponentialRechargeSpeed: false,
	maxOutPut: 500,
});

const reactorControllerTick = (): [setTurbine: number, setFission: number] => {
	const turbineRate = reactor.GetLoad() / (reactor.maxPowerOutput / 100);
	reactor.SetTurbineOutput(turbineRate);
	const fissionRate = turbineRate / (reactor.GetFuel() / rE);
	reactor.SetFissionRate(fissionRate);

	return [turbineRate, fissionRate];
};

const logStatus = (tick: number, [turbineRate, fissionRate]: [number, number]) => {
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

const logic = (tick: number) => {
	logStatus(tick, reactorControllerTick());
};

new Simulator({
	simulate: Powered.PoweredList,
	logic,
	type: SimType.RealTime,
	tickRate: 20,
	maxTicks: 20 * 60,
}).start();
