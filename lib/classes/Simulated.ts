export class Simulated {
	protected deltaTime: number;

	constructor(tickRate: number) {
		this.deltaTime = 1 / tickRate;
	}
}

export interface SimulatedInterface {
	tick(deltaTime?: number): void;
}
