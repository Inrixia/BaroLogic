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
const rE = 65;
// Reactor Fuel
let rF = 0;

import { promisify } from "util";
import { Reactor, Rods } from "./Reactor";
const sleep = promisify(setTimeout);

const tickRate = 20;
const reactor = new Reactor(5200, [Rods.Normal, Rods.Normal, Rods.Normal, Rods.Normal]);

reactor.SetLoad(1000);

const mainLoop = () => {
	reactor.tick();

	console.clear();
	console.log(`Power: ${reactor.Power} kW`);
	console.log(`Fuel: ${reactor.Fuel}`);
	console.log(`Turbine: ${reactor.TurbineOutput}`);
	console.log(`Fission: ${reactor.FissionRate}`);
	console.log(`Temperature: ${reactor.Temperature}`);
	console.log(`Load: ${reactor.Load} kW`);

	sleep(1000 / tickRate).then(mainLoop);
};
mainLoop();
