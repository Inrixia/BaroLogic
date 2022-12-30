import { LogHelper, reduceHelpers } from ".";
import { LoadGenerator } from "../classes/LoadGenerator";

export const LoadGeneratorReducer = (loadGenerator: LoadGenerator) =>
	reduceHelpers([
		LogHelper.Heading("[== LoadGen ==]"),
		new LogHelper(() => loadGenerator.Load, { label: "Load", units: "kW" }),
		new LogHelper(() => loadGenerator.Power, { label: "Power", units: "kW" }),
	]);
