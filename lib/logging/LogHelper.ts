import { SimInfo } from "../Simulator";
import { Generator, Logger, Value, isNum } from "./helpers";

export class LogHelper {
	private generator: Generator;
	private units: string;
	private label: string;
	private noDelta: boolean;

	private previous?: Value;
	private current?: Value;

	public static NoDelta = false;
	public static HelperTicks: LogHelper["tick"][] = [];

	private delta: string = "";
	private updateCurrent(simInfo: SimInfo) {
		this.current = this.generator(simInfo);
		if (this.previous !== undefined && !this.noDelta && !LogHelper.NoDelta) {
			if (isNum(this.previous) && isNum(this.current)) this.delta = ` ${Math.sign(this.current - this.previous) >= 0 ? "+" : ""}${(this.current - this.previous).toFixed(2)}${this.units}`;
			else if (typeof this.previous === "boolean") this.delta = ` (${this.previous})`;
		}
	}

	constructor(generator: Generator, opts: { label?: string; units?: string; noDelta?: true }) {
		this.generator = generator;
		this.units = opts.units ?? "";
		this.label = opts.label !== undefined ? opts.label + ": " : "";
		this.noDelta = opts.noDelta ?? false;
		LogHelper.HelperTicks.push(this.tick.bind(this));
	}

	public txt(simInfo: SimInfo) {
		this.updateCurrent(simInfo);
		let current = this.current;
		if (isNum(current)) current = current.toFixed(2);
		const txt = `${this.label}${current}${this.units}${this.delta}`;
		this.previous = this.current;
		return txt;
	}

	public tick(simInfo: SimInfo) {
		this.previous = this.current;
		this.current = this.generator(simInfo);
	}

	static Newline: () => "" = () => "";
	static Heading: (heading: string) => () => string = (heading) => () => heading;

	static ReduceHelpers(helpers: Logger[], decimator: string = "\n", prefix: string = "") {
		const loggers = (helpers = helpers.map((helper) => (helper instanceof LogHelper ? helper.txt.bind(helper) : helper)));
		return (simInfo: SimInfo) => loggers.reduce((txt, logger) => `${txt}${txt !== prefix ? decimator : ""}${logger(simInfo)}`, prefix);
	}

	/**
	 * Ticks all LogHelper instances
	 */
	static TickHelpers(simInfo: SimInfo) {
		for (const helper of LogHelper.HelperTicks) helper(simInfo);
	}
}

const isLogHelper = (logger: Logger): logger is LogHelper => logger instanceof LogHelper;
