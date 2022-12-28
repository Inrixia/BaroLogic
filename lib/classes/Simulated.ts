export class Simulated {
	static DeltaTime(tickRate: number) {
		return 1 / tickRate;
	}

	public tick(deltaTime: number) {}
}
