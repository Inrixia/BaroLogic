import { PowerContainer } from "../classes/PowerContainer";
import { LogHelper } from "./LogHelper";

export const BatteryText = (battery: PowerContainer) =>
	LogHelper.ReduceHelpers([
		new LogHelper(battery.GetPowerValueOut, { label: "Power Value Out", units: "kW" }),
		new LogHelper(battery.GetCharge, { label: "Battery Charge", units: "kW" }),
		new LogHelper(battery.GetChargePercentage, { label: "Charge Percentage", units: "%" }),
		new LogHelper(battery.GetChargeRate, { label: "Charge Rate", units: "%" }),
		LogHelper.Newline,
		new LogHelper(() => battery.realChargeSpeed, { label: "Real Charge Speed", units: "kW" }),
	]);

export const MultiBatteryReducer = (batteries: PowerContainer[]) =>
	LogHelper.ReduceHelpers([
		LogHelper.Heading(`[== BATTERIES x${batteries.length} ==]`),
		new LogHelper(() => batteries.reduce((s, b) => s + b.GetPowerValueOut(), 0), { label: "Power Value Out", units: "kW" }),
		LogHelper.Newline,
		LogHelper.ReduceHelpers(
			batteries.map((battery) => new LogHelper(battery.GetCharge.bind(battery), { units: "kW", noDelta: true })),
			", ",
			"Charge: "
		),
		new LogHelper(() => batteries.reduce((s, b) => s + b.GetCharge(), 0) / batteries.length, { label: "Charge (sum)", units: "kW" }),
		LogHelper.Newline,
		LogHelper.ReduceHelpers(
			batteries.map((battery) => new LogHelper(battery.GetChargePercentage.bind(battery), { units: "%", noDelta: true })),
			", ",
			"Charge Percentage: "
		),
		new LogHelper(() => batteries.reduce((s, b) => s + b.GetChargePercentage(), 0) / batteries.length, { label: "Charge Percentage (sum)", units: "%" }),
		LogHelper.Newline,
		new LogHelper(() => batteries.reduce((s, b) => s + b.GetChargeRate(), 0) / batteries.length, { units: "%", label: "Charge Rate" }),
		LogHelper.Newline,
		new LogHelper(() => batteries.reduce((s, b) => s + b.realChargeSpeed, 0), { units: "kW", label: "Real Load (Charge Rate)" }),
	]);
