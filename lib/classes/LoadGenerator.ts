import { Clamp } from "../math";
import { Powered } from "./Powered";

type NormalOpts = { minLoad: number; maxLoad: number; maxAvgLoad: number; maxLoadSpike: number; currentAvgLoad: number };
export class LoadGenerator extends Powered {
	public Load: number = 0;
	public Power: number = 0;

	protected GetCurrentPowerConsumption(): number {
		return this.Load;
	}

	protected GetPowerOut(): number {
		return this.Power;
	}

	public normalLoad({ minLoad, maxLoad, maxAvgLoad, maxLoadSpike, currentAvgLoad }: NormalOpts): void {
		// Generate a random change in load between -maxChange and maxChange
		const change = (Math.random() * 2 - 1) * maxLoadSpike;

		// Calculate the new load value by adding the change to the previous load value
		this.Load += change;

		// Ensure that the load value stays within the specified range
		this.Load = Clamp(this.Load, minLoad, maxLoad);

		// If the average load value exceeds the max average load, reduce the load value by the maximum allowed change
		if (currentAvgLoad > maxAvgLoad) this.Load = Math.max(minLoad, this.Load - Math.random() * maxLoadSpike);
	}
}
