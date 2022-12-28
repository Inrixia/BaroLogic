import { Powered } from "./classes/Powered";
import { Simulated } from "./classes/Simulated";

export enum SimStatus {
	RealTime,
	Timed,
	Endless,
	Stopped,
}

export type SimInfo = {
	tick: number;
	maxTicks: number;
	tickRate: number;
	time: number;
	deltaTime: number;
	simTime: number;
};

type SimulatorOpts = {
	simulate: Simulated[];
	logic?: (info: SimInfo) => SimStatus | void;
	log?: (info: SimInfo) => void;
	type: SimStatus;
	tickRate: number;
	simTime: number;
};

export class Simulator {
	private simulate: SimulatorOpts["simulate"];
	private status: SimulatorOpts["type"];
	private logic: Exclude<SimulatorOpts["logic"], undefined>;
	private log: Exclude<SimulatorOpts["log"], undefined>;

	tickRate: SimulatorOpts["tickRate"];
	simTime: SimulatorOpts["simTime"];

	constructor(opts: SimulatorOpts) {
		this.simulate = opts.simulate;
		this.status = opts.type;
		this.logic = opts.logic ?? (() => {});
		this.log = opts.log ?? (() => {});

		this.tickRate = opts.tickRate;
		this.simTime = opts.simTime;
	}

	private hrS(time?: [number, number]) {
		const hrTime = process.hrtime(time);
		return hrTime[0] + hrTime[1] / 1000000000;
	}

	public async start() {
		const staticDeltaTime = Simulated.DeltaTime(this.tickRate);
		let deltaTime = staticDeltaTime;
		let tick = 0;
		let time = 0;

		let lastTick = process.hrtime();
		const targetDelta = 1 / this.tickRate;

		const maxTicks = this.simTime * this.tickRate;
		mainLoop: while (true) {
			if (this.status === SimStatus.RealTime) {
				if (this.hrS(lastTick) < targetDelta) continue;
				deltaTime = this.hrS(lastTick);
				lastTick = process.hrtime();
			} else deltaTime = staticDeltaTime;
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
				case SimStatus.Timed: {
					if (tick >= maxTicks) {
						this.log(simInfo);
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
