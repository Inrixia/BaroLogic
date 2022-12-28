import { Lerp } from "../math";

export class Grid {
	public Voltage: number = 0;
	public Load: number = 0;
	public Power: number = 0;

	public Health: number = 100;
	public MaxHealth: number = 100;

	public overloadCooldownTimer: number = 5;
	public overloadCooldown: number = 5;
	/**
	 * How much power has to be supplied to the grid relative to the load before item starts taking damage.
	 * E.g. a value of 2 means that the grid has to be receiving twice as much power as the devices in the grid are consuming.
	 */
	protected overloadVoltage: number = 2;

	public UpdateFaliures(deltaTime: number) {
		if (this.Voltage > this.overloadVoltage && this.Health !== 0) {
			if (this.overloadCooldownTimer > 0) {
				this.overloadCooldownTimer -= deltaTime;
				return;
			}

			// damaged boxes are more sensitive to overvoltage (also preventing all boxes from breaking at the same time)
			const conditionFactor = Lerp(5, 1, this.Health / this.MaxHealth);
			this.Health -= deltaTime * randRange(10, 500) * conditionFactor;

			this.overloadCooldownTimer = this.overloadCooldown;

			if (Math.random() < Lerp(0.15, 0.15 * 0.1, 0.5)) this.Health = 0;

			if (this.Health < 0) this.Health = 0;
		}
	}
}

const randRange = (min: number, max: number) => {
	return Math.random() * (max - min) + min;
};
