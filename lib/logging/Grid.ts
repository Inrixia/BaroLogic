import { Powered } from "../classes/Powered";
import { LogHelper, reduceHelpers } from "./helpers";

export const GridText = () => {
	const helpers = [
		new LogHelper(() => Powered.Grid.Load, { label: "Load", units: "kW" }),
		new LogHelper(() => Powered.Grid.Power, { label: "Power", units: "kW" }),
		LogHelper.Newline,
		new LogHelper(() => Powered.Grid.Voltage, { label: "Voltage", units: "v" }),
		new LogHelper(() => Powered.Grid.overloadCooldownTimer, { label: "Overload In", units: "s", noDelta: true }),
		new LogHelper(() => Powered.Grid.Health, { label: "Health", units: "%", noDelta: true }),
	];
	return reduceHelpers(helpers);
};
