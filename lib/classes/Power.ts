export class PowerRange {
	public static get Zero(): PowerRange {
		return new PowerRange(0, 0);
	}

	public Min: number;
	public Max: number;

	public ReactorMaxOutput: number;

	constructor(Min: number, Max: number, reactorMaxOutput: number = 0) {
		this.Min = Min;
		this.Max = Max;
		this.ReactorMaxOutput = reactorMaxOutput;
	}

	public Add(b: PowerRange) {
		this.Min = this.Min + b.Min;
		this.Max = this.Max + b.Max;
		this.ReactorMaxOutput = this.ReactorMaxOutput + b.ReactorMaxOutput;
	}
	public Minus(b: PowerRange) {
		this.Min = this.Min - b.Min;
		this.Max = this.Max - b.Max;
		this.ReactorMaxOutput = this.ReactorMaxOutput - b.ReactorMaxOutput;
	}
}

export enum PowerPriority {
	Default = 0,
	Reactor = 1,
	Relay = 2,
	Battery = 5,
}

export enum Connection {
	In,
	Out,
}
