import { Powered } from "./classes/Powered";
import { Simulated } from "./classes/Simulated";

export enum SimStatus {
	RealTime,
	Endless,
	Stopped,
}

export type SimInfo = {
	tick: number;
	maxTicks: number;
	tickRate: number;
	time: number;
	deltaTime: number;
};

type SimulatorOpts =
	| {
			simulate: Simulated[];
			logic?: (info: SimInfo) => SimStatus | void;
			log?: (info: SimInfo) => void;
			type: SimStatus.RealTime;
			tickRate?: number;
			simSpeed?: number;
	  }
	| {
			simulate: Simulated[];
			logic?: (info: SimInfo) => SimStatus | void;
			log?: (info: SimInfo) => void;
			type: SimStatus.Endless;
			tickRate?: number;
			simSpeed?: number;
	  };

export class Simulator {
	private simulate: Simulated[];
	private status: SimStatus;
	private logic: (info: SimInfo) => SimStatus | void;
	private log: (info: SimInfo) => SimStatus | void;

	private tickRate: number = 20;
	private simTime: number = 0;

	private simSpeed: number = 1;

	constructor(opts: SimulatorOpts) {
		this.simulate = opts.simulate;
		this.status = opts.type;
		this.logic = opts.logic ?? (() => {});
		this.log = opts.log ?? (() => {});

		this.tickRate = opts.tickRate ?? this.tickRate;
		this.simSpeed = opts.simSpeed ?? this.simSpeed;
	}

	private hrS(time?: [number, number]) {
		const hrTime = process.hrtime(time);
		return hrTime[0] + hrTime[1] / 1000000000;
	}

	public async start() {
		const targetDelta = Simulated.DeltaTime(this.tickRate);
		const maxTicks = this.simTime * this.tickRate;

		let deltaTime = targetDelta;
		let tick = 0;
		let time = 0;

		let lastTick = process.hrtime();

		mainLoop: while (true) {
			if (this.status === SimStatus.RealTime) {
				if (this.hrS(lastTick) < targetDelta / this.simSpeed) continue;
				deltaTime = this.hrS(lastTick) * this.simSpeed;
				lastTick = process.hrtime();
			} else deltaTime = targetDelta;
			tick++;
			time += deltaTime;

			for (const simulated of this.simulate) simulated.tick(deltaTime);

			Powered.UpdatePower(deltaTime);

			const simInfo = { time, tick, tickRate: this.tickRate, simTime: this.simTime, deltaTime, maxTicks };

			this.status = this.logic(simInfo) ?? this.status;

			switch (this.status) {
				case SimStatus.RealTime: {
					this.log(simInfo);
					break;
				}
				case SimStatus.Stopped: {
					this.log(simInfo);
					break mainLoop;
				}
			}
		}
	}
}
