import { LogHelper } from ".";
import { LoadGenerator } from "../classes/LoadGenerator";

export const LoadGeneratorReducer = (loadGenerator: LoadGenerator) =>
	LogHelper.ReduceHelpers([
		LogHelper.Heading("[== LoadGen ==]"),
		new LogHelper(() => loadGenerator.Load, { label: "Load", units: "kW" }),
		new LogHelper(() => loadGenerator.Power, { label: "Power", units: "kW" }),
	]);
