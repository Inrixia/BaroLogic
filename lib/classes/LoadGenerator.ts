import { Clamp } from "../math";
import { Powered } from "./Powered";

export class LoadGenerator extends Powered {
	public Load: number = 0;
	public Power: number = 0;

	protected GetCurrentPowerConsumption(): number {
		return this.Load;
	}

	protected GetPowerOut(): number {
		return this.Power;
	}

	public normalLoad(minLoad: number, maxLoad: number, maxLoadSpike: number): void {
		const loadLow = this.Load <= minLoad + 100;
		const loadHigh = this.Load >= maxLoad - 100;

		const sign = loadLow ? 1 : loadHigh ? -1 : Math.random() > 0.5 ? 1 : -1;

		this.Load += Math.random() * maxLoadSpike * sign;
		this.Load = Clamp(this.Load, minLoad, maxLoad);
	}
}
