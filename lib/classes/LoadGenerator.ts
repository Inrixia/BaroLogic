import { PowerRange } from "./Power";
import { Powered } from "./Powered";

export class LoadGenerator extends Powered {
	public Load: number = 0;
	public Power: number = 0;

	public GetCurrentPowerConsumption(deltaTime: number): number {
		return this.Load;
	}

	public GetPowerOut(power: number, load: number, minMaxPower: PowerRange, deltaTime: number): number {
		return this.Power;
	}
}
