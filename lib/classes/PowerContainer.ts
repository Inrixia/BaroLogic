import { Clamp, RoundTowardsClosest } from "../math";
import { PowerPriority, PowerRange } from "./Power";
import { Powered } from "./Powered";

type PowerContainerOpts = {
	maxRechargeSpeed?: number;
	maxChargeMultiplier?: number;
	maxCharge?: number;
	charge?: number;
	exponentialRechargeSpeed?: boolean;
	maxOutPut?: number;
	efficiency?: number;
};

export class PowerContainer extends Powered {
	/**
	 * Maximum output of the device when fully charged (kW).
	 */
	public maxOutPut: number = 1000;

	/**
	 * Capacity Multiplier from Talents
	 */
	private maxChargeMultiplier: number = 1;

	/**
	 * If true, the recharge speed (and power consumption) of the device goes up exponentially as the recharge rate is increased.
	 */
	private exponentialRechargeSpeed: boolean = false;

	private adjustedCapacity: number = 0;
	private prevCharge: number = 0;

	private _currPowerOutput: number = 0;

	private _maxCharge: number = 2000;
	private _maxRechargeSpeed: number = 500;
	private _rechargeSpeed: number = this._maxRechargeSpeed;
	private _efficiency: number = 0.95;
	private _charge: number = 0;

	private set currPowerOutput(power: number) {
		this._currPowerOutput = Math.max(power, 0);
	}
	private get currPowerOutput() {
		return this._currPowerOutput;
	}

	/**
	 * The maximum capacity of the device (kW * min). For example, a value of 1000 means the device can output 100 kilowatts of power for 10 minutes, or 1000 kilowatts for 1 minute.
	 */
	private set maxCharge(capacity: number) {
		this._maxCharge = Math.max(capacity, 1);
		this.adjustedCapacity = this._maxCharge * this.maxChargeMultiplier;
	}
	public get maxCharge() {
		return this._maxCharge;
	}

	/**
	 * The current charge of the device.
	 */
	private set charge(charge: number) {
		this._charge = Clamp(charge, 0, this.adjustedCapacity);
	}
	private get charge() {
		return this._charge;
	}

	/**
	 * How fast the device can be recharged. For example, a recharge speed of 100 kW and a capacity of 1000 kW*min would mean it takes 10 minutes to fully charge the device.
	 */
	private set maxRechargeSpeed(maxSpeed: number) {
		this._maxRechargeSpeed = Math.max(maxSpeed, 1);
	}
	public get maxRechargeSpeed() {
		return this._maxRechargeSpeed;
	}

	/**
	 * The current recharge speed of the device.
	 */
	private set rechargeSpeed(speed: number) {
		this._rechargeSpeed = Clamp(speed, 0, this.maxRechargeSpeed);
		this._rechargeSpeed = RoundTowardsClosest(this._rechargeSpeed, Math.max(this.maxRechargeSpeed * 0.1, 1));
	}
	public get rechargeSpeed() {
		return this._rechargeSpeed;
	}

	/**
	 * The amount of power you can get out of a item relative to the amount of power that's put into it.
	 */
	private set efficiency(efficiency: number) {
		this._efficiency = Clamp(efficiency, 0, 1);
	}
	public get efficiency() {
		return this._efficiency;
	}

	public get realChargeSpeed() {
		return this.currPowerConsumption * this.voltage * this.efficiency;
	}

	constructor(opts: PowerContainerOpts = {}) {
		super(PowerPriority.Battery);

		this.maxRechargeSpeed = opts.maxRechargeSpeed ?? this.maxRechargeSpeed;
		this.maxChargeMultiplier = opts.maxChargeMultiplier ?? this.maxChargeMultiplier;
		this.maxCharge = opts.maxCharge ?? this.maxCharge;
		this.charge = opts.charge ?? this.charge;
		this.exponentialRechargeSpeed = opts.exponentialRechargeSpeed ?? this.exponentialRechargeSpeed;
		this.maxOutPut = opts.maxOutPut ?? this.maxOutPut;
		this.efficiency = opts.efficiency ?? this.efficiency;

		this.isActive = true;
	}

	// Signals
	public GetPowerValueOut(): number {
		return this.currPowerOutput;
	}
	public GetLoadValueOut(): number {
		return Powered.Grid.Load;
	}
	public GetCharge(): number {
		return this.charge;
	}
	public GetChargePercentage(): number {
		return (this.charge / this.adjustedCapacity) * 100;
	}
	public GetChargeRate(): number {
		return (this.rechargeSpeed / this.maxRechargeSpeed) * 100;
	}

	public SetChargeRate(rate: number) {
		const rechargeRate = Clamp(rate / 100, 0, 1);
		this.rechargeSpeed = rechargeRate * this.maxRechargeSpeed;
	}

	// Powered
	protected GetCurrentPowerConsumption() {
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

	protected MinMaxPowerOut(load: number, deltaTime: number) {
		let maxOutput;
		let chargeRatio = this.prevCharge / this.adjustedCapacity;
		if (chargeRatio < 0.1) {
			maxOutput = Math.max(chargeRatio * 10, 0) * this.maxOutPut;
		} else {
			maxOutput = this.maxOutPut;
		}

		// Limit max power out to not exceed the charge of the container
		maxOutput = Math.min(maxOutput, (this.prevCharge * 60) / deltaTime);
		return new PowerRange(0, maxOutput);
	}

	protected GetPowerOut(power: number, load: number, minMaxPower: PowerRange, deltaTime: number) {
		if (minMaxPower.Max <= 0) return 0;
		// Set power output based on the relative max power output capabilities and load demand
		return (this.currPowerOutput = Clamp((load - power) / minMaxPower.Max, 0, 1) * this.MinMaxPowerOut(load, deltaTime).Max);
	}

	protected GridResolved(deltaTime: number) {
		// Decrease charge based on how much power is leaving the device
		this.charge = Clamp(this.charge - (this.currPowerOutput / 60) * deltaTime, 0, this.adjustedCapacity);
		this.prevCharge = this.charge;

		// Increase charge based on how much power came in from the grid
		this.charge += ((this.currPowerConsumption * this.voltage) / 60) * deltaTime * this.efficiency;
	}
}
