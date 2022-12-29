import { Reactor } from "./lib/classes/Reactor";
import { Rod, Rods, Quality } from "./lib/classes/FuelRod";
import { PowerContainer } from "./lib/classes/PowerContainer";
import { SimInfo, SimStatus, Simulator } from "./lib/Simulator";
import { Powered } from "./lib/classes/Powered";
import { batteryText, gridText, reactorText } from "./lib/logging";
import { LoadGenerator } from "./lib/classes/LoadGenerator";

const reactor = new Reactor({
	maxPowerOutput: 3000,
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
const b1 = new PowerContainer({
	charge,
});
const b2 = new PowerContainer({
	charge,
});
// const b3 = new PowerContainer({
// 	charge,
// });
// const b4 = new PowerContainer({
// 	charge,
// });
// const b5 = new PowerContainer({
// 	charge,
// });

const loadGenerator = new LoadGenerator();

const log = ({ tick, time, tickRate, deltaTime }: SimInfo) => {
	console.clear();
	const txt = `[== REACTOR ==]
${reactorText(reactor, tickRate)}

[== BATTERY 1 ==]
${batteryText(b1)}

[== BATTERY 2 ==]
${batteryText(b2)}

[== ARC ==]
Load: ${load.toFixed(2)} kW
Battery Load: ${batteryLoad.toFixed(2)} kW

Max Seen Voltage: ${maxSeenVoltage.toFixed(2)} V
Avg Voltage: ${(sumVoltage / tick).toFixed(2)} V
Min Seen Voltage: ${minSeenVoltage.toFixed(2)} V

[== LoadGen ==]
Load: ${loadGenerator.Load.toFixed(2)} kW
Power: ${loadGenerator.Power.toFixed(2)} kW

[== GRID ==]
${gridText(tickRate)}

[== SIM ==]
Tick: ${tick}, Sec: ${time.toFixed(2)}s, DeltaTime: ${(deltaTime * 1000).toFixed(2)}ms`;

	console.log(txt);
};

const efficiency = 75;

const batteryChargeUnits = 100 / b1.maxRechargeSpeed;
const numBatteries = 5;

let maxSeenVoltage = 0;
let sumVoltage = 0;
let minSeenVoltage = 1;

const desiredVoltage = 2;

let load = 0;
let batteryLoad = 0;
const ARCTick = () => {
	if (maxSeenVoltage < Powered.Grid.Voltage) maxSeenVoltage = Powered.Grid.Voltage;
	if (maxSeenVoltage > 0 && minSeenVoltage > Powered.Grid.Voltage) minSeenVoltage = Powered.Grid.Voltage;
	sumVoltage += Powered.Grid.Voltage;

	batteryLoad = (b1.GetChargeRate() / batteryChargeUnits) * numBatteries;
	// Reactor
	// load = Math.min((reactor.GetLoadValueOut() - batteryLoad) * desiredVoltage, reactor.maxPowerOutput);
	load = Math.min(reactor.GetLoadValueOut(), reactor.maxPowerOutput);
	const turbineRate = load / (reactor.maxPowerOutput / 100);
	reactor.SetTurbineOutput(turbineRate);
	reactor.SetFissionRate(turbineRate / (reactor.GetFuelOut() / efficiency));

	// // Batteries
	// if (b1.GetChargePrecentage() < 15) {
	// 	setBatteryChargeRate(100);
	// 	return;
	// }
	// const current = (Powered.Grid.Power - Powered.Grid.Load) / 2;
	// let desiredDistributedRate = (current / numBatteries) * batteryChargeUnits;

	// if (desiredDistributedRate < b1.GetChargeRate()) {
	// 	desiredDistributedRate = b1.GetChargeRate() - 10;
	// }

	// setBatteryChargeRate(Math.max(desiredDistributedRate, 10));
};

const setBatteryChargeRate = (rate: number) => {
	b1.SetChargeRate(rate);
	b2.SetChargeRate(rate);
	// b3.SetChargeRate(rate);
	// b4.SetChargeRate(rate);
	// b5.SetChargeRate(rate);
};

loadGenerator.Load = 500;

const logic = ({ tick, tickRate, time }: SimInfo) => {
	// if (reactor.GetFuelPercentageLeft() <= 0 || reactor.melted || Powered.Grid.Health <= 0 || Powered.Grid.Voltage > 2.1) return SimStatus.Stopped;

	ARCTick();

	// loadGenerator.Load = Math.max(Math.random() * 10000, 500);

	// if (time > 300) return SimStatus.RealTime;
};

new Simulator({
	simulate: Powered.PoweredList,
	logic,
	log,
	type: SimStatus.RealTime,
	tickRate: 20,
	simSpeed: 1,
}).start();
