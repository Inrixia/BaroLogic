import { Reactor } from "../classes/Reactor";
import { LogHelper } from "./LogHelper";

// Reactor
export const ReactorReducer = (reactor: Reactor) =>
	LogHelper.ReduceHelpers([
		LogHelper.Heading("[== REACTOR ==]"),
		new LogHelper(reactor.GetPowerValueOut.bind(reactor), { label: "Power Out", units: "kW" }),
		new LogHelper(reactor.GetFuelOut.bind(reactor), { label: "Fuel Out", noDelta: true }),
		new LogHelper(reactor.GetFuelPercentageLeft.bind(reactor), { label: "Fuel Percentage Left", units: "%", noDelta: true }),
		new LogHelper(() => reactor.GetTemperatureOut() / 100, { label: "Temperature", units: "%" }),
		LogHelper.Newline,
		new LogHelper(() => reactor.needMoreFuel, { label: "Need More Fuel" }),
		new LogHelper(() => reactor.tooMuchFuel, { label: "Too Much Fuel" }),
		LogHelper.Newline,
		LogHelper.ReduceHelpers(
			[new LogHelper(() => reactor.turbineOutput, { label: "Real", units: "%" }), new LogHelper(() => reactor.signalTurbineOutput, { label: "Signal", units: "%" })],
			", ",
			"[Turbine] - "
		),
		LogHelper.ReduceHelpers(
			[new LogHelper(() => reactor.fissionRate, { label: "Real", units: "%" }), new LogHelper(() => reactor.signalFissionRate, { label: "Signal", units: "%" })],
			", ",
			"[Fission] - "
		),
		LogHelper.Newline,
		LogHelper.ReduceHelpers(
			reactor.rods.map((rod) => new LogHelper(() => (rod === null ? null : (rod.durability / rod.maxDurability) * 100), { units: "%", noDelta: true })),
			", ",
			"[Rods] - "
		),
		LogHelper.Newline,
		new LogHelper(() => reactor.temperatureCritical, { label: "Temperature Critical" }),
		new LogHelper(() => reactor.meltDownTimer, { label: "Melted in", units: "s", noDelta: true }),
		LogHelper.Newline,
		new LogHelper(() => reactor.temperatureHot, { label: "Temperature Hot" }),
		new LogHelper(() => reactor.fireDelay - reactor.fireTimer, { label: "Fire in", units: "s", noDelta: true }),
		new LogHelper(() => reactor.onFire, { label: "On Fire", units: "s", noDelta: true }),
		LogHelper.Newline,
		new LogHelper(() => reactor.reactorHealth, { label: "Health", units: "%" }),
		LogHelper.Newline,
		new LogHelper(() => reactor.melted, { label: "Melted" }),
		new LogHelper(() => reactor.powerOn, { label: "Power On" }),
	]);
