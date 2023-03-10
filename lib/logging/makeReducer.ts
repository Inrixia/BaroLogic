import { GridReducer, LogHelper, Logger, MultiBatteryReducer, ReactorReducer, SimReducer } from ".";
import { LoadGenerator } from "../classes/LoadGenerator";
import { PowerContainer } from "../classes/PowerContainer";
import { Reactor } from "../classes/Reactor";
import { LoadGeneratorReducer } from "./LoadGenerator";

type MakeOpts = { reactor?: Reactor; batteries?: PowerContainer[]; loadGenerators?: LoadGenerator[]; extras?: Logger[]; iterReducer?: Logger };
export const makeReducer = ({ reactor, batteries, loadGenerators, iterReducer, extras }: MakeOpts) => {
	const helpers: Logger[] = [];
	if (reactor !== undefined) helpers.push(ReactorReducer(reactor), LogHelper.Newline);
	if (batteries !== undefined) helpers.push(MultiBatteryReducer(batteries), LogHelper.Newline);
	if (loadGenerators !== undefined) helpers.push(...loadGenerators.flatMap((loadGenerator) => [LoadGeneratorReducer(loadGenerator), LogHelper.Newline]));
	if (extras !== undefined) helpers.push(...extras.flatMap((extra) => [extra, LogHelper.Newline]));
	helpers.push(GridReducer(), LogHelper.Newline);
	helpers.push(SimReducer(), LogHelper.Newline);
	if (iterReducer !== undefined) helpers.push(iterReducer, LogHelper.Newline);
	return LogHelper.ReduceHelpers(helpers);
};
