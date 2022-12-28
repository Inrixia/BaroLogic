export class PowerRange {
	public static readonly Zero: PowerRange = new PowerRange(0, 0);

	public readonly Min: number;
	public readonly Max: number;

	public readonly ReactorMaxOutput: number;

	constructor(Min: number, Max: number, reactorMaxOutput: number = 0) {
		this.Min = Min;
		this.Max = Max;
		this.ReactorMaxOutput = reactorMaxOutput;
	}

	public static Add(a: PowerRange, b: PowerRange): PowerRange {
		return new PowerRange(a.Min + b.Min, a.Max + b.Max, a.ReactorMaxOutput + b.ReactorMaxOutput);
	}
	public static Minus(a: PowerRange, b: PowerRange): PowerRange {
		return new PowerRange(a.Min - b.Min, a.Max - b.Max, a.ReactorMaxOutput - b.ReactorMaxOutput);
	}
}

export enum PowerPriority {
	Default = 0,
	Reactor = 1,
	Relay = 2,
	Battery = 5,
}
