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
}
