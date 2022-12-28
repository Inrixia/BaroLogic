import { Powered } from "./classes/Powered";
import { Simulated } from "./classes/Simulated";

export enum SimType {
	RealTime,
	Timed,
	Endless,
}

type SimulatorOpts = {
	simulate: Simulated[];
	logic: (tick: number) => void;
	type: SimType;
	tickRate: number;
	maxTicks: number;
};

import { promisify } from "util";
const sleep = promisify(setTimeout);

export class Simulator {
	private simulate: SimulatorOpts["simulate"];
	private type: SimulatorOpts["type"];
	private logic: SimulatorOpts["logic"];

	tickRate: SimulatorOpts["tickRate"];
	maxTicks: SimulatorOpts["maxTicks"];

	constructor(opts: SimulatorOpts) {
		this.simulate = opts.simulate;
		this.type = opts.type;
		this.logic = opts.logic;

		this.tickRate = opts.tickRate;
		this.maxTicks = opts.maxTicks;
	}

	public async start() {
		const deltaTime = Simulated.DeltaTime(this.tickRate);
		let tick = 0;
		mainLoop: while (true) {
			this.logic(tick);
			tick++;

			for (const simulated of this.simulate) simulated.tick(deltaTime);

			Powered.UpdatePower(deltaTime);

			switch (this.type) {
				case SimType.RealTime: {
					await sleep(1000 / this.tickRate);
					break;
				}
				case SimType.Timed: {
					if (tick >= this.maxTicks) break mainLoop;
					break;
				}
			}
		}
	}
}
