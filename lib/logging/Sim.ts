import { LogHelper } from ".";

export const SimReducer = () =>
	LogHelper.ReduceHelpers([
		LogHelper.Heading("[== SIM ==]"),
		LogHelper.ReduceHelpers(
			[
				new LogHelper(({ tick }) => tick, { label: "Tick", noDelta: true }),
				new LogHelper(({ time }) => (time / 60).toFixed(0), { label: "Time", units: "m", noDelta: true }),
				new LogHelper(({ time }) => time % 60, { units: "s", noDelta: true }),
				new LogHelper(({ deltaTime }) => deltaTime * 1000, { label: "DeltaTime", units: "ms" }),
			],
			", "
		),
	]);

export const timeForm = (time: number): [minutes: number, seconds: number] => [~~(time / 60), time % 60];
export const timeFormString = (time: number): string => {
	const [minutes, seconds] = timeForm(time);
	return `${minutes}m ${seconds.toFixed(2)}s`;
};
