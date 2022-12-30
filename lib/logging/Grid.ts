import { Powered } from "../classes/Powered";
import { reduceHelpers } from "./helpers";
import { LogHelper } from "./LogHelper";

export const GridReducer = () =>
	reduceHelpers([
		LogHelper.Heading("[== GRID ==]"),
		new LogHelper(() => Powered.Grid.Load, { label: "Load", units: "kW" }),
		new LogHelper(() => Powered.Grid.Power, { label: "Power", units: "kW" }),
		LogHelper.Newline,
		new LogHelper(() => Powered.Grid.Voltage, { label: "Voltage", units: "v" }),
		new LogHelper(() => Powered.Grid.overloadCooldownTimer, { label: "Overload In", units: "s", noDelta: true }),
		new LogHelper(() => Powered.Grid.Health, { label: "Health", units: "%", noDelta: true }),
	]);
