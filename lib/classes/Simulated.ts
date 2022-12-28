export class Simulated {
	protected deltaTime: number;

	constructor(tickRate: number) {
		this.deltaTime = Simulated.DeltaTime(tickRate);
	}

	static DeltaTime(tickRate: number) {
		return 1 / tickRate;
	}
}

export interface SimulatedInterface {
	tick(deltaTime?: number): void;
}
