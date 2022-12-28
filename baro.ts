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
import { SimInfo, SimStatus, Simulator } from "./lib/Simulator";
import { Powered } from "./lib/classes/Powered";
import { batteryText, gridText, reactorText } from "./lib/logging";

const reactor = new Reactor({
	maxPowerOutput: 5200,
	maxPowerOutputMultiplier: 1,
	rods: [Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal)],
	reactorMaxHealth: 100,
	fireDelay: 20,
	meltDownDelay: 120,
	fuelConsumptionRate: 0.2,
	playerDegreeOfSuccess: 0,
	powerOn: true,
	autoTemp: false,
});

const battery = new PowerContainer({
	capacityMultiplier: 1,
	capacity: 2000,
	charge: 0,
	maxRechargeSpeed: 500,
	exponentialRechargeSpeed: false,
	maxOutPut: 500,
	efficiency: 0.95,
});

const reactorControllerTick = () => {
	const turbineRate = reactor.GetLoadValueOut() / (reactor.maxPowerOutput / 100);
	reactor.SetTurbineOutput(turbineRate);
	reactor.SetFissionRate(turbineRate / (reactor.GetFuelOut() / rE));
};

const log = ({ tick, time, tickRate, deltaTime }: SimInfo) => {
	console.clear();
	const txt = `[== REACTOR ==]
${reactorText(reactor, tickRate)}

[== BATTERY ==]
${batteryText(battery)}

[== GRID ==]
${gridText()}

[== SIM ==]
Tick: ${tick}, Sec: ${time.toFixed(2)}s, DeltaTime: ${(deltaTime * 1000).toFixed(2)}ms`;

	console.log(txt);
};

const logic = () => {
	reactorControllerTick();

	if (battery.GetChargePrecentage() > 98) return SimStatus.RealTime;
};

new Simulator({
	simulate: Powered.PoweredList,
	logic,
	log,
	type: SimStatus.Endless,
	tickRate: 20,
	simTime: 128,
}).start();
