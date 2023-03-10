import { timeFormString } from ".";
import { LogHelper } from "./LogHelper";

export type IterInfo = {
	timeAliveSum: number;
	iterations: number;
	maxSeenVoltage: number;
	minSeenVoltage: number;
	ticks: number;
	voltageSum: number;
	voltageBlipsSum: number;
	voltageBlips: number;
};

export const IterReducer = (itr: IterInfo) =>
	LogHelper.ReduceHelpers([
		LogHelper.Heading("[== ITERATE ==]"),
		new LogHelper(() => timeFormString(itr.timeAliveSum / itr.iterations), { label: "Avg Time Alive" }),
		new LogHelper(() => itr.maxSeenVoltage, { label: "Max Seen Voltage", units: "v" }),
		new LogHelper(() => itr.voltageSum / itr.ticks, { label: "Avg Voltage", units: "v" }),
		new LogHelper(() => itr.minSeenVoltage, { label: "Min Seen Voltage", units: "v" }),
		new LogHelper(() => itr.voltageBlipsSum / itr.iterations || 0, { label: "Avg Voltage Blip", units: "v" }),
		new LogHelper(() => itr.voltageBlips / itr.iterations, { label: "Avg Voltage Blips" }),
		LogHelper.ReduceHelpers(
			[
				new LogHelper(() => itr.iterations, { label: "Iterations", noDelta: true }),
				new LogHelper(() => itr.ticks, { label: "Ticks", noDelta: true }),
				new LogHelper(() => timeFormString(itr.timeAliveSum), { label: "Time", noDelta: true }),
			],
			", "
		),
	]);
