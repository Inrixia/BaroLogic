import { Clamp, Lerp, NearlyEqual, adjustValueWithoutOverShooting } from "../math";
import { FuelRod } from "./FuelRod";
import { PowerPriority, PowerRange } from "./Power";
import { Powered } from "./Powered";
import { Vector2 } from "./Generics";

type Rods = [FuelRod, FuelRod, FuelRod, FuelRod];

type ReactorOptions = {
	maxPowerOutput: number;
	maxPowerOutputMultiplier: number;
	rods: Rods;
	fuelConsumptionRate: number;
	meltDownDelay: number;
	fireDelay: number;
	reactorMaxHealth: number;
	playerDegreeOfSuccess: number;
	powerOn: boolean;
	autoTemp: boolean;
};

export class Reactor extends Powered {
	private load: number = 0;

	private _meltDownTimer = 0;
	private set meltDownTimer(timer: number) {
		this._meltDownTimer = timer;
	}
	public get meltDownTimer(): number {
		return this._meltDownTimer;
	}

	private _fireTimer = 0;
	private set fireTimer(timer: number) {
		this._fireTimer = timer;
	}
	public get fireTimer(): number {
		return this._fireTimer;
	}

	public powerOn: boolean;
	public autoTemp: boolean;

	private optimalTemperature: Vector2 = new Vector2(0, 0);
	private allowedTemperature: Vector2 = new Vector2(0, 0);
	private optimalFissionRate: Vector2 = new Vector2(0, 0);
	private allowedFissionRate: Vector2 = new Vector2(0, 0);
	private optimalTurbineOutput: Vector2 = new Vector2(0, 0);
	// private allowedTurbineOutput: Vector2 = new Vector2(0, 0);

	private maxUpdatePowerOut: number = 0;
	private minUpdatePowerOut: number = 0;

	private _maxPowerOutput: number = 0;
	/**
	 * How much power (kW) the reactor generates when operating at full capacity.
	 */
	private set maxPowerOutput(max: number) {
		this._maxPowerOutput = Math.max(0, max * this.maxPowerOutputMultiplier);
	}
	public get maxPowerOutput() {
		return this._maxPowerOutput;
	}

	private maxPowerOutputMultiplier: number = 1;

	private _temperature: number = 0;
	/**
	 * Current temperature of the reactor (0% - 100%). Indended to be used by StatusEffect conditionals.
	 */
	private set temperature(temp: number) {
		this._temperature = Clamp(temp, 0, 100);
	}
	public get temperature() {
		return this._temperature;
	}

	private _fissionRate: number = 0;
	/**
	 * Current fission rate of the reactor (0% - 100%). Intended to be used by StatusEffect conditionals (setting the value from XML is not recommended).
	 */
	private set fissionRate(rate: number) {
		this._fissionRate = Clamp(rate, 0, 100);
	}
	public get fissionRate() {
		return this._fissionRate;
	}

	private _turbineOutput: number = 0;
	/**
	 * Current turbine output of the reactor (0% - 100%). Intended to be used by StatusEffect conditionals (setting the value from XML is not recommended).
	 */
	private set turbineOutput(output: number) {
		this._turbineOutput = Clamp(output, 0, 100);
	}
	public get turbineOutput() {
		return this._turbineOutput;
	}

	private _fuelConsumptionRate: number = 0;
	/**
	 * How fast the condition of the contained fuel rods deteriorates per second.
	 */
	private set fuelConsumptionRate(rate: number) {
		this._fuelConsumptionRate = Math.max(0, rate);
	}
	public get fuelConsumptionRate() {
		return this._fuelConsumptionRate;
	}

	private _meltDownDelay: number = 0;
	/**
	 * How long the temperature has to stay critical until a meltdown occurs.
	 */
	private set meltDownDelay(delay: number) {
		this._meltDownDelay = Math.max(0, delay);
	}
	public get meltDownDelay() {
		return this._meltDownDelay;
	}

	private _fireDelay: number = 0;
	/**
	 * How long the temperature has to stay critical until the reactor catches fire.
	 */
	private set fireDelay(delay: number) {
		this._fireDelay = Math.max(0, delay);
	}
	public get fireDelay() {
		return this._fireDelay;
	}

	private _tolerance: { readonly optimal: number; readonly allowed: number } = { optimal: 0, allowed: 0 };
	private get tolerance() {
		return this._tolerance;
	}

	private _degreeOfSuccess: number = 0;
	private set degreeOfSuccess(degree: number) {
		this._degreeOfSuccess = Clamp(degree, 0, 1);
		this._tolerance = {
			optimal: Lerp(2.5, 10.0, this.degreeOfSuccess),
			allowed: Lerp(5, 20, this.degreeOfSuccess),
		};
	}
	private get degreeOfSuccess() {
		return this._degreeOfSuccess;
	}

	private _rods: Rods = [null, null, null, null];
	/**
	 * Reactor fuel rods.
	 * Default: [null, null, null, null]
	 */
	private set rods(rods: Rods) {
		this._rods = rods;
	}
	public get rods() {
		return this._rods;
	}

	private _reactorHealth: number = 100;
	/**
	 * Reactor health 0-100
	 */
	private set reactorHealth(health: number) {
		this._reactorHealth = Math.max(0, health);
	}
	public get reactorHealth() {
		return this._reactorHealth;
	}

	private readonly reactorMaxHealth: number;

	constructor(opts: ReactorOptions) {
		super(PowerPriority.Reactor);
		this.rods = opts.rods;
		this.maxPowerOutputMultiplier = opts.maxPowerOutputMultiplier;
		this.maxPowerOutput = opts.maxPowerOutput;
		this.fuelConsumptionRate = opts.fuelConsumptionRate;
		this.meltDownDelay = opts.meltDownDelay;
		this.fireDelay = opts.fireDelay;
		this.reactorHealth = this.reactorMaxHealth = opts.reactorMaxHealth;
		this.degreeOfSuccess = opts.playerDegreeOfSuccess;
		this.powerOn = opts.powerOn;
		this.autoTemp = opts.autoTemp;

		this.isActive = true;
	}

	public get fuelHeat() {
		return this.rods.reduce((heatValue, rod) => {
			if (rod === null) return heatValue;
			if (rod.durability !== 0) heatValue += rod.heat;
			return heatValue;
		}, 0);
	}

	// BEGIN Signals
	public GetTemperatureOut() {
		return this.temperature * 100;
	}
	public GetPowerValueOut() {
		const temperatureFactor = Math.min(this.temperature / 50, 1);
		return this.maxPowerOutput * Math.min(this.turbineOutput / 100, temperatureFactor);
	}
	public GetFuelOut() {
		return this.fuelHeat;
	}
	public GetFuelPercentageLeft() {
		return this.rods.reduce((durability, rod) => {
			if (rod === null) return durability;
			if (rod.durability !== 0) durability += rod.durability;
			return durability;
		}, 0);
	}
	public GetLoadValueOut() {
		return this.load;
	}

	private _signalFissionRate: number | null = null;
	private set signalFissionRate(rate: number | null) {
		if (rate === null) this._signalFissionRate = null;
		else this._signalFissionRate = Clamp(rate, 0, 100);
	}
	public get signalFissionRate() {
		return this._signalFissionRate;
	}

	private _signalTurbineOutput: number | null = null;
	private set signalTurbineOutput(output: number | null) {
		if (output === null) this._signalTurbineOutput = null;
		else this._signalTurbineOutput = Clamp(output, 0, 100);
	}
	public get signalTurbineOutput() {
		return this._signalTurbineOutput;
	}

	public SetFissionRate(rate: number | null) {
		this.signalFissionRate = rate;
	}
	public SetTurbineOutput(output: number | null) {
		this.signalTurbineOutput = output;
	}
	// END Signals

	/**
	 * Is the temperature currently critical. Intended to be used by StatusEffect conditionals (setting the value from XML has no effect).
	 */
	public get temperatureCritical() {
		return this.temperature > this.allowedTemperature.Y;
	}
	public get temperatureHot() {
		return this.temperature > this.optimalTemperature.Y;
	}
	private _onFire: number = 0;
	/**
	 * Ticks the reactor has been on fire
	 */
	private set onFire(onFire: number) {
		this._onFire = onFire;
	}
	public get onFire() {
		return this._onFire;
	}

	private _melted: boolean = false;
	/**
	 * true if reactor has melted down.
	 */
	private set melted(melted: boolean) {
		this._melted = melted;
	}
	public get melted() {
		return this._melted;
	}

	/**
	 * @param minimumOutputRatio How low we allow the output/load ratio to go before loading more fuel. 1.0 = always load more fuel when maximum output is too low, 0.5 = load more if max output is 50% of the load
	 */
	private GetNeedMoreFuel(minimumOutputRatio = 0.5, minCondition = 0): boolean {
		if (this.GetFuelPercentageLeft() <= minCondition && this.load > 0) {
			return true;
		}

		// fission rate is clamped to the amount of available fuel
		const maxFissionRate = Math.min(this.fuelHeat, 100);
		if (maxFissionRate >= 100) {
			return false;
		}

		const maxTurbineOutput = 100;

		// calculate the maximum output if the fission rate is cranked as high as it goes and turbine output is at max
		const theoreticalMaxHeat = this.GetGeneratedHeat(maxFissionRate);
		const temperatureFactor = Math.min(theoreticalMaxHeat / 50, 1);
		const theoreticalMaxOutput = Math.min(maxTurbineOutput / 100, temperatureFactor) * this.maxPowerOutput;

		// maximum output not enough, we need more fuel
		return theoreticalMaxOutput < this.load * minimumOutputRatio;
	}
	public get needMoreFuel() {
		return this.GetNeedMoreFuel();
	}

	private GetTooMuchFuel(): boolean {
		if (this.GetFuelPercentageLeft() <= 0) return false;

		// get the amount of heat we'd generate if the fission rate was at the low end of the optimal range
		const minimumHeat = this.GetGeneratedHeat(this.optimalFissionRate.X);

		// if we need a very high turbine output to keep the engine from overheating, there's too much fuel
		return minimumHeat > Math.min(this.correctTurbineOutput * 1.5, 90);
	}
	public get tooMuchFuel() {
		return this.GetTooMuchFuel();
	}

	private targetFissionRate: number = 0;
	private targetTurbineOutput: number = 0;

	private correctTurbineOutput: number = 0;

	public tick(deltaTime: number) {
		if (this.melted) return;

		// use a smoothed "correct output" instead of the actual correct output based on the load
		// so the player doesn't have to keep adjusting the rate impossibly fast when the load fluctuates heavily
		if (!NearlyEqual(this.maxPowerOutput, 0)) this.correctTurbineOutput += Clamp((this.load / this.maxPowerOutput) * 100 - this.correctTurbineOutput, -20, 20) * deltaTime;

		// calculate tolerances of the meters based on the skills of the user
		// more skilled characters have larger "sweet spots", making it easier to keep the power output at a suitable level
		this.optimalTurbineOutput = new Vector2(this.correctTurbineOutput - this.tolerance.optimal, this.correctTurbineOutput + this.tolerance.optimal);
		// this.allowedTurbineOutput = new Vector2(this.correctTurbineOutput - this.tolerance.allowed, this.correctTurbineOutput + this.tolerance.allowed);

		this.optimalTemperature = Vector2.Lerp(new Vector2(40, 60), new Vector2(30, 70), this.degreeOfSuccess);
		this.allowedTemperature = Vector2.Lerp(new Vector2(30, 70), new Vector2(10, 90), this.degreeOfSuccess);

		this.optimalFissionRate = Vector2.Lerp(new Vector2(30, this.fuelHeat - 20), new Vector2(20, this.fuelHeat - 10), this.degreeOfSuccess);
		this.optimalFissionRate.X = Math.min(this.optimalFissionRate.X, this.optimalFissionRate.Y - 10);
		this.allowedFissionRate = Vector2.Lerp(new Vector2(20, this.fuelHeat), new Vector2(10, this.fuelHeat), this.degreeOfSuccess);
		this.allowedFissionRate.X = Math.min(this.allowedFissionRate.X, this.allowedFissionRate.Y - 10);

		if (this.signalFissionRate !== null) {
			this.targetFissionRate = adjustValueWithoutOverShooting(this.targetFissionRate, this.signalFissionRate, deltaTime * 5);
		}
		if (this.signalTurbineOutput !== null) {
			this.targetTurbineOutput = adjustValueWithoutOverShooting(this.targetTurbineOutput, this.signalTurbineOutput, deltaTime * 5);
		}

		if (!this.powerOn) {
			this.targetFissionRate = 0;
			this.targetTurbineOutput = 0;
		} else if (this.autoTemp) this.UpdateAutoTemp(2, deltaTime);

		const temperatureDiff = this.GetGeneratedHeat(this.fissionRate) - this.turbineOutput - this.temperature;
		this.temperature += Clamp(Math.sign(temperatureDiff) * 10 * deltaTime, -Math.abs(temperatureDiff), Math.abs(temperatureDiff));

		this.fissionRate = Lerp(this.fissionRate, Math.min(this.targetFissionRate, this.fuelHeat), deltaTime);
		this.turbineOutput = Lerp(this.turbineOutput, this.targetTurbineOutput, deltaTime);

		if (this.fissionRate > 0) {
			for (const rod of this.rods) {
				if (rod === null) continue;
				rod.durability -= (this.fissionRate / 100) * (this.fuelConsumptionRate / rod.quality) * deltaTime;
				if (rod.durability < 0) rod.durability = 0;
			}
		}

		this.updateFaliures(deltaTime);
	}

	private UpdateAutoTemp(speed: number, deltaTime: number) {
		const desiredTurbineOutput = (this.optimalTurbineOutput.X + this.optimalTurbineOutput.Y) / 2;
		this.targetTurbineOutput += Clamp(desiredTurbineOutput - this.targetTurbineOutput, -speed, speed) * deltaTime;
		this.targetTurbineOutput = Clamp(this.targetTurbineOutput, 0, 100);

		const desiredFissionRate = (this.optimalFissionRate.X + this.optimalFissionRate.Y) / 2;
		this.targetFissionRate += Clamp(desiredFissionRate - this.targetFissionRate, -speed, speed) * deltaTime;

		if (this.temperature > (this.optimalTemperature.X + this.optimalTemperature.Y) / 2) {
			this.targetFissionRate = Math.min(this.targetFissionRate - speed * 2 * deltaTime, this.allowedFissionRate.Y);
		} else if (-this.currPowerConsumption < this.load) {
			this.targetFissionRate = Math.min(this.targetFissionRate + speed * 2 * deltaTime, 100);
		}
		this.targetFissionRate = Clamp(this.targetFissionRate, 0, 100);

		// don't push the target too far from the current fission rate
		// otherwise we may "overshoot", cranking the target fission rate all the way up because it takes a while
		// for the actual fission rate and temperature to follow
		this.targetFissionRate = Clamp(this.targetFissionRate, this.fissionRate - 5, this.fissionRate + 5);
	}

	private meltDown() {
		this.melted = true;
		// this.reactorHealth = 0;
		// this.fireTimer = 0;
		// this.meltDownTimer = 0;
		// for (const rod of this.rods) {
		// 	if (rod === null) continue;
		// 	rod.durability = 0;
		// }
	}

	private updateFaliures(deltaTime: number) {
		if (this.temperatureCritical) {
			this.meltDownTimer += Lerp(deltaTime * 2, deltaTime, this.reactorHealth / this.reactorMaxHealth);
			if (this.meltDownTimer > this.meltDownDelay) {
				this.meltDown();
				return;
			}
		} else {
			this.meltDownTimer = Math.max(0, this.meltDownTimer - deltaTime);
		}

		if (this.temperatureHot) {
			this.fireTimer += Lerp(deltaTime * 2, deltaTime, this.reactorHealth / this.reactorMaxHealth);
			if (this.fireTimer >= this.fireDelay) {
				this.onFire++;
				this.fireTimer = this.fireDelay;
				this.reactorHealth -= deltaTime;
			}
		} else this.fireTimer = Math.max(0, this.fireTimer - deltaTime);
	}

	private GetGeneratedHeat(fissionRate: number) {
		return fissionRate * (this.fuelHeat / 100) * 2;
	}

	// Powered functions

	public GetCurrentPowerConsumption() {
		return 0;
	}

	public MinMaxPowerOut(): PowerRange {
		let tolerance = 1;

		// If within the optimal output allow for slight output adjustments
		if (
			this.turbineOutput > this.optimalTurbineOutput.X &&
			this.turbineOutput < this.optimalTurbineOutput.Y &&
			this.temperature > this.optimalTemperature.X &&
			this.temperature < this.optimalTemperature.Y
		) {
			tolerance = 3;
		}

		const temperatureFactor = Math.min(this.temperature / 50, 1);
		const minOutput = this.maxPowerOutput * Clamp(Math.min((this.turbineOutput - tolerance) / 100, temperatureFactor), 0, 1);
		const maxOutput = this.maxPowerOutput * Math.min((this.turbineOutput + tolerance) / 100, temperatureFactor);

		this.minUpdatePowerOut = minOutput;
		this.maxUpdatePowerOut = maxOutput;

		return new PowerRange(minOutput, maxOutput, this.powerOn ? this.maxPowerOutput : this.maxUpdatePowerOut);
	}

	/**
	 * Determine how much power to output based on the load. The load is divided between reactors according to their maximum output in multi-reactor setups.
	 */
	public GetPowerOut(power: number, load: number, minMaxPower: PowerRange) {
		// Load must be calculated at this stage instead of at gridResolved to remove influence of lower priority devices
		let loadLeft = Math.max(load - power, 0);
		let expectedPower = Clamp(loadLeft, minMaxPower.Min, minMaxPower.Max);

		// Delta ratio of Min and Max power output capability of the grid
		let ratio = Math.max((loadLeft - minMaxPower.Min) / (minMaxPower.Max - minMaxPower.Min), 0);
		if (!isFinite(ratio)) ratio = 0;

		let output = Clamp(ratio * (this.maxUpdatePowerOut - this.minUpdatePowerOut) + this.minUpdatePowerOut, this.minUpdatePowerOut, this.maxUpdatePowerOut);
		let newLoad = loadLeft;

		// Adjust behaviour for multi reactor setup
		if (this.maxPowerOutput != minMaxPower.ReactorMaxOutput) {
			const idealLoad = (this.maxPowerOutput / minMaxPower.ReactorMaxOutput) * loadLeft;
			const loadAdjust = Clamp((ratio - 0.5) * 25 + idealLoad - (this.turbineOutput / 100) * this.maxPowerOutput, -this.maxPowerOutput / 100, this.maxPowerOutput / 100);
			newLoad = Clamp(loadLeft - (expectedPower - output) + loadAdjust, 0, loadLeft);
		}

		if (Math.sign(newLoad) === -1) newLoad = 0;

		this.load = newLoad;
		this.currPowerConsumption = -output;
		return output;
	}
}
