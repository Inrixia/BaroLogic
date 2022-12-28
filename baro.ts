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
import { SimStatus, Simulator } from "./lib/Simulator";
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
	powerOn: true,
	autoTemp: false,
});

const battery = new PowerContainer({
	capacityMultiplier: 1,
	capacity: 1000,
	maxRechargeSpeed: 500,
	exponentialRechargeSpeed: false,
	maxOutPut: 500,
	efficiency: 0.95,
});

const reactorControllerTick = (): [setTurbine: number, setFission: number] => {
	const turbineRate = reactor.GetLoadValueOut() / (reactor.maxPowerOutput / 100);
	reactor.SetTurbineOutput(turbineRate);
	const fissionRate = turbineRate / (reactor.GetFuelOut() / rE);
	reactor.SetFissionRate(fissionRate);

	return [turbineRate, fissionRate];
};

const log = (tick: number) => {
	console.clear();
	const txt = `[== REACTOR ==]
Power Value Out: ${reactor.GetPowerValueOut().toFixed(2)} kW
Fuel Out: ${reactor.GetFuelOut()}
Fuel Percentage Left: ${reactor.GetFuelPercentageLeft().toFixed(2)}%
Temperatur Out: ${(reactor.GetTemperatureOut() / 100).toFixed(2)}%
Load Value Out: ${reactor.GetLoadValueOut()} kW

Need More Fuel: ${reactor.needMoreFuel}
Too Much Fuel: ${reactor.tooMuchFuel}

[Turbine] - Real: ${reactor.turbineOutput.toFixed(2)}, Set: ${reactor.signalTurbineOutput?.toFixed(2)}
[Fission] - Real: ${reactor.fissionRate.toFixed(2)}, Set: ${reactor.signalFissionRate?.toFixed(2)}

Rods:${reactor.rods.map((rod) => {
		if (rod === null) return ` null`;
		return ` ${((rod.durability / rod.maxDurability) * 100).toFixed(2)}%`;
	})}

Temperature Critical: ${reactor.temperatureCritical}
Temperature Hot: ${reactor.temperatureHot}
Meltdown Delay: ${reactor.meltDownDelay.toFixed(2)}
Fire Delay: ${reactor.fireDelay.toFixed(2)}

On Fire: ${reactor.onFire / tickRate}s
Health: ${reactor.reactorHealth}%

Melted: ${reactor.melted}
Is Powered On: ${reactor.powerOn}

[== BATTERY ==]
Power Value Out: ${battery.GetPowerValueOut().toFixed(2)} kW
Load Value Out: ${battery.GetLoadValueOut().toFixed(2)} kW
Charge: ${battery.GetCharge().toFixed(2)} kW
Charge %: ${battery.GetChargePrecentage().toFixed(2)}%
Load Value Out: ${battery.GetLoadValueOut().toFixed(2)} kW
Charge Rate: ${battery.GetChargeRate().toFixed(2)} %

[== GRID ==]
Voltage: ${Powered.Grid.Voltage}
Load: ${Powered.Grid.Load}
Power: ${Powered.Grid.Power}

Tick: ${tick}, Sec: ${tick / tickRate}`;

	console.log(txt);
};

const logic = (tick: number) => {
	reactorControllerTick();

	if (battery.GetChargePrecentage() > 99) return SimStatus.RealTime;
};

new Simulator({
	simulate: Powered.PoweredList,
	logic,
	log,
	type: SimStatus.Endless,
	tickRate: 20,
	maxTicks: 20 * 60,
}).start();
