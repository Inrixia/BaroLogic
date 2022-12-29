import { Reactor } from "./lib/classes/Reactor";
import { Rod, Rods, Quality } from "./lib/classes/FuelRod";
import { PowerContainer } from "./lib/classes/PowerContainer";
import { SimInfo, SimStatus, Simulator } from "./lib/Simulator";
import { Powered } from "./lib/classes/Powered";
import { batteryText, gridText, reactorText } from "./lib/logging";
import { LoadGenerator } from "./lib/classes/LoadGenerator";

const reactor = new Reactor({
	maxPowerOutput: 5200,
	rods: [Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal), Rod(Rods.Normal, Quality.Normal)],
});

const battery = new PowerContainer();

const loadGenerator = new LoadGenerator();

let efficiency = 75;
const reactorControllerTick = () => {
	const load = Math.min(reactor.GetLoadValueOut(), reactor.maxPowerOutput);
	const turbineRate = load / (reactor.maxPowerOutput / 100);
	reactor.SetTurbineOutput(turbineRate);
	reactor.SetFissionRate(turbineRate / (reactor.GetFuelOut() / efficiency));
};

const log = ({ tick, time, tickRate, deltaTime }: SimInfo) => {
	console.clear();
	const txt = `[== REACTOR ==]
${reactorText(reactor, tickRate)}

[== ARC ==]
Efficiency: ${efficiency.toFixed(2)}%

[== BATTERY ==]
${batteryText(battery)}

[== GRID ==]
${gridText(tickRate)}

[== SIM ==]
Tick: ${tick}, Sec: ${time.toFixed(2)}s, DeltaTime: ${(deltaTime * 1000).toFixed(2)}ms`;

	console.log(txt);
};

const logic = ({ tick, tickRate }: SimInfo) => {
	reactorControllerTick();

	loadGenerator.Load = 1000;

	// if (battery.GetChargePrecentage() > 10) {
	// 	battery.SetChargeRate(0);
	// }

	if (reactor.melted) return SimStatus.Stopped;
	const goRealtime = Powered.Grid.Voltage > 2 || battery.GetChargePrecentage() >= 9;
	if (goRealtime) return SimStatus.RealTime;
};

new Simulator({
	simulate: Powered.PoweredList,
	logic,
	log,
	type: SimStatus.RealTime,
	tickRate: 20,
	simTime: 128,
	simSpeed: 1,
}).start();
