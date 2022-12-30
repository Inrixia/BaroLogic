import { GridReducer, LogHelper, Logger, MultiBatteryReducer, ReactorReducer, SimReducer, reduceHelpers } from ".";
import { LoadGenerator } from "../classes/LoadGenerator";
import { PowerContainer } from "../classes/PowerContainer";
import { Reactor } from "../classes/Reactor";
import { LoadGeneratorReducer } from "./LoadGenerator";

export const makeReducer = (opts?: { reactor?: Reactor; batteries?: PowerContainer[]; loadGenerator?: LoadGenerator; extras?: Logger[] }) => {
	const helpers: Logger[] = [];
	if (opts?.reactor !== undefined) helpers.push(ReactorReducer(opts.reactor), LogHelper.Newline);
	if (opts?.batteries !== undefined) helpers.push(MultiBatteryReducer(opts.batteries), LogHelper.Newline);
	if (opts?.loadGenerator !== undefined) helpers.push(LoadGeneratorReducer(opts.loadGenerator), LogHelper.Newline);
	if (opts?.extras !== undefined) helpers.push(...opts.extras.flatMap((extra) => [extra, LogHelper.Newline]));
	helpers.push(GridReducer(), LogHelper.Newline);
	helpers.push(SimReducer(), LogHelper.Newline);
	return reduceHelpers(helpers);
};
