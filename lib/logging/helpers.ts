import { SimInfo } from "../Simulator";

export const txt = (previous: number, current: number, units: string) => `${current.toFixed(2)} ${units} (${Math.sign(current - previous) > 0 ? "-" : "+"}${(previous - current).toFixed(2)} ${units})`;

type Value = number | boolean | null | string;
type Generator = (simInfo: SimInfo) => Value;
export class LogHelper {
	private generator: Generator;
	private units: string;
	private label: string;
	private noDelta: boolean;

	private previous?: Value;

	public static NoDelta = false;

	private delta: string = "";
	private current?: Value;
	private updateCurrent(simInfo: SimInfo) {
		this.current = this.generator(simInfo);
		if (isNum(this.current)) {
			if (this.noDelta || LogHelper.NoDelta) this.delta = "";
			else if (isNum(this.previous)) this.delta = ` ${Math.sign(this.current - this.previous) >= 0 ? "+" : ""}${(this.current - this.previous).toFixed(2)}${this.units}`;
			else this.delta = ` (${this.previous})`;
		}
	}

	constructor(generator: Generator, opts: { label?: string; units?: string; noDelta?: true }) {
		this.generator = generator;
		this.units = opts.units ?? "";
		this.label = opts.label !== undefined ? opts.label + ": " : "";
		this.noDelta = opts.noDelta ?? false;
	}

	public txt(simInfo: SimInfo) {
		this.updateCurrent(simInfo);
		let current = this.current;
		if (isNum(current)) current = current.toFixed(2);
		const txt = `${this.label}${current}${this.units}${this.delta}`;
		this.previous = this.current;
		return txt;
	}

	static Newline: () => "" = () => "";
	static Heading: (heading: string) => () => string = (heading) => () => heading;
}

const isNum = (value: unknown): value is number => typeof value === "number";

const rnd = (value: number) => ~~(value * 100) / 100;

type Logger = ((simInfo: SimInfo) => string) | LogHelper;

export const reduceHelpers =
	(helpers: Logger[], decimator: string = "\n", prefix: string = "") =>
	(simInfo: SimInfo) =>
		helpers.reduce((txt, helper) => `${txt}${txt !== prefix ? decimator : ""}${helper instanceof LogHelper ? helper.txt(simInfo) : helper(simInfo)}`, prefix);
