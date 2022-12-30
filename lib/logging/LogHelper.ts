import { SimInfo } from "../Simulator";
import { Generator, Value, isNum } from "./helpers";

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
