import { Powered } from "./classes/Powered";
import { Simulated } from "./classes/Simulated";

export enum SimStatus {
	RealTime,
	Timed,
	Endless,
	Stopped,
}

type SimulatorOpts = {
	simulate: Simulated[];
	logic: (tick: number, maxTicks: number) => SimStatus | void;
	log: (tick: number, maxTicks: number) => void;
	type: SimStatus;
	tickRate: number;
	maxTicks: number;
};

import { promisify } from "util";
const sleep = promisify(setTimeout);

export class Simulator {
	private simulate: SimulatorOpts["simulate"];
	private status: SimulatorOpts["type"];
	private logic: SimulatorOpts["logic"];
	private log: SimulatorOpts["log"];

	tickRate: SimulatorOpts["tickRate"];
	maxTicks: SimulatorOpts["maxTicks"];

	constructor(opts: SimulatorOpts) {
		this.simulate = opts.simulate;
		this.status = opts.type;
		this.logic = opts.logic;
		this.log = opts.log;

		this.tickRate = opts.tickRate;
		this.maxTicks = opts.maxTicks;
	}

	public async start() {
		const deltaTime = Simulated.DeltaTime(this.tickRate);
		let tick = 0;
		mainLoop: while (true) {
			tick++;

			for (const simulated of this.simulate) simulated.tick(deltaTime);

			Powered.UpdatePower(deltaTime);

			this.status = this.logic(tick, this.maxTicks) ?? this.status;

			switch (this.status) {
				case SimStatus.RealTime: {
					this.log(tick, this.maxTicks);
					await sleep(1000 / this.tickRate);
					break;
				}
				case SimStatus.Timed: {
					if (tick >= this.maxTicks) {
						this.log(tick, this.maxTicks);
						break mainLoop;
					}
					break;
				}
				case SimStatus.Stopped: {
					break mainLoop;
				}
			}
		}
	}
}
