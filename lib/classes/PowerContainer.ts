import { Clamp, RoundTowardsClosest } from "../math";
import { PowerPriority, PowerRange } from "./Power";
import { PoweredInterface, Powered } from "./Powered";
import { SimulatedInterface } from "./Simulated";

type PowerContainerOpts = {
	tickRate: number;
	maxRechargeSpeed: number;
	capacityMultiplier: number;
	exponentialRechargeSpeed: boolean;
	maxOutPut: number;
};

export class PowerContainer extends Powered implements SimulatedInterface, PoweredInterface {
	/**
	 * Maximum output of the device when fully charged (kW).
	 */
	private maxOutPut: number = 0;

	/**
	 * Capacity Multiplier from Talents
	 */
	private capacityMultiplier: number;

	/**
	 * If true, the recharge speed (and power consumption) of the device goes up exponentially as the recharge rate is increased.
	 */
	private exponentialRechargeSpeed: boolean;

	protected readonly powerPriority: PowerPriority = PowerPriority.Battery;

	private _currPowerOutput: number = 0;
	private get currPowerOutput() {
		return this._currPowerOutput;
	}
	private set currPowerOutput(power: number) {
		this._currPowerOutput = Math.max(power, 0);
	}

	private adjustedCapacity: number = 0;

	private _capacity: number = 0;
	/**
	 * The maximum capacity of the device (kW * min). For example, a value of 1000 means the device can output 100 kilowatts of power for 10 minutes, or 1000 kilowatts for 1 minute.
	 */
	private get capacity() {
		return this._capacity;
	}
	private set capacity(capacity: number) {
		this._capacity = Math.max(capacity, 1);
		this.adjustedCapacity = this._capacity * this.capacityMultiplier;
	}

	private prevCharge: number = 0;

	private _charge: number = 0;
	/**
	 * The current charge of the device.
	 */
	private get charge() {
		return this._charge;
	}
	private set charge(charge: number) {
		this._charge = Clamp(charge, 0, this.adjustedCapacity);
	}

	private get chargePercentage() {
		return (this.charge / this.adjustedCapacity) * 100;
	}

	private _maxRechargeSpeed: number = 0;
	/**
	 * How fast the device can be recharged. For example, a recharge speed of 100 kW and a capacity of 1000 kW*min would mean it takes 10 minutes to fully charge the device.
	 */
	private get maxRechargeSpeed() {
		return this._maxRechargeSpeed;
	}
	private set maxRechargeSpeed(maxSpeed: number) {
		this._maxRechargeSpeed = Math.max(maxSpeed, 1);
	}

	private _rechargeSpeed: number = 0;
	/**
	 * The current recharge speed of the device.
	 */
	private get rechargeSpeed() {
		return this._rechargeSpeed;
	}
	private set rechargeSpeed(speed: number) {
		this._rechargeSpeed = Clamp(speed, 0, this.maxRechargeSpeed);
		this._rechargeSpeed = RoundTowardsClosest(this._rechargeSpeed, Math.max(this.maxRechargeSpeed * 0.1, 1));
	}

	private _efficiency: number = 0;
	/**
	 * The amount of power you can get out of a item relative to the amount of power that's put into it.
	 */
	private get efficiency() {
		return this._efficiency;
	}
	private set efficiency(efficiency: number) {
		this._efficiency = Clamp(efficiency, 0, 1);
	}

	constructor(opts: PowerContainerOpts) {
		super(opts.tickRate);
		this.capacityMultiplier = opts.capacityMultiplier;
		this.maxRechargeSpeed = opts.maxRechargeSpeed;
		this.exponentialRechargeSpeed = opts.exponentialRechargeSpeed;

		this.isActive = true;
	}

	public tick(deltaTime?: number) {
		deltaTime ??= this.deltaTime;
	}

	// BEGIN Signals
	public GetPowerValueOut(): number {
		return this.currPowerOutput;
	}
	public GetLoadValueOut(): number {
		return Powered.Grid.Load;
	}
	public GetCharge(): number {
		return this.charge;
	}
	public GetChargePrecent(): number {
		return (this.charge / this.adjustedCapacity) * 100;
	}
	public GetChargeRate(): number {
		return (this.rechargeSpeed / this.maxRechargeSpeed) * 100;
	}

	public SetChargeRate(rate: number) {
		const rechargeRate = Clamp(rate / 100, 0, 1);
		this.rechargeSpeed = rechargeRate * this.maxRechargeSpeed;
	}
	// END Signals

	public GetPowerConsumption() {
		// Don't draw power if fully charged
		if (this.charge >= this.adjustedCapacity) {
			this.charge = this.adjustedCapacity;
			return 0;
		} else {
			const missingCharge = this.adjustedCapacity - this.charge;
			let targetRechargeSpeed = this.rechargeSpeed;

			if (this.exponentialRechargeSpeed) {
				targetRechargeSpeed = Math.pow(this.rechargeSpeed / this.maxRechargeSpeed, 2) * this.maxRechargeSpeed;
			}
			// For the last kwMin scale the recharge rate linearly to prevent overcharging and to have a smooth cutoff
			if (missingCharge < 1) {
				targetRechargeSpeed *= missingCharge;
			}

			return Clamp(targetRechargeSpeed, 0, this.maxRechargeSpeed);
		}
	}

	public GridResolved() {
		// Increase charge based on how much power came in from the grid
		this.charge += ((this.currPowerConsumption * this.voltage) / 60) * this.updateInterval * this.efficiency;

		// Decrease charge based on how much power is leaving the device
		this.charge = Clamp(this.charge - (this.currPowerOutput / 60) * this.updateInterval, 0, this.adjustedCapacity);
	}

	public GetPowerOut(load: number, power: number, minMaxPower: PowerRange) {
		// Set power output based on the relative max power output capabilities and load demand
		this.currPowerOutput = Clamp((load - power) / minMaxPower.Max, 0, 1) * this.MinMaxPowerOut(load).Max;
		return this.currPowerOutput;
	}

	public MinMaxPowerOut(load: number) {
		let maxOutput;
		let chargeRatio = this.prevCharge / this.adjustedCapacity;
		if (chargeRatio < 0.1) {
			maxOutput = Math.max(chargeRatio * 10, 0) * this.maxOutPut;
		} else {
			maxOutput = this.maxOutPut;
		}

		// Limit max power out to not exceed the charge of the container
		maxOutput = Math.min(maxOutput, (this.prevCharge * 60) / this.updateInterval);
		return new PowerRange(0, maxOutput);
	}
}
