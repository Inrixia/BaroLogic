type FuelRod = {
	durability: number;
	heat: number;
} | null;

export const Rods = {
	Normal: {
		durability: 100,
		heat: 80,
	},
	Thorium: {
		durability: 200,
		heat: 100,
	},
	Fulgurium: {
		durability: 150,
		heat: 150,
	},
	VolatileFulgurium: {
		durability: 400,
		heat: 150,
	},
} as const;

type Rods = [FuelRod, FuelRod, FuelRod, FuelRod];

type ReactorOptions = { rMax: number; rods: Rods; tickRate: number; fuelConsumptionRate?: number; meltDownDelay?: number; fireDelay?: number; reactorMaxHealth?: number };

export class Reactor {
	private load: number = 0;

	private meltDownTimer = 0;
	private fireTimer = 0;

	private _maxPowerOutput: number = 0;
	private set maxPowerOutput(max: number) {
		this._maxPowerOutput = Math.max(0, max);
	}
	public get maxPowerOutput() {
		return this._maxPowerOutput;
	}

	private _temperature: number = 0;
	private set temperature(temp: number) {
		this._temperature = Clamp(temp, 0, 100);
	}
	private get temperature() {
		return this._temperature;
	}

	private _fissionRate: number = 0;
	private set fissionRate(rate: number) {
		this._fissionRate = Clamp(rate, 0, 100);
	}
	private get fissionRate() {
		return this._fissionRate;
	}

	private _turbineOutput: number = 0;
	private set turbineOutput(output: number) {
		this._turbineOutput = Clamp(output, 0, 100);
	}
	private get turbineOutput() {
		return this._turbineOutput;
	}

	private _fuelConsumptionRate: number = 0;
	private set fuelConsumptionRate(rate: number) {
		this._fuelConsumptionRate = Math.max(0, rate);
	}
	private get fuelConsumptionRate() {
		return this._fuelConsumptionRate;
	}

	private _meltDownDelay: number = 0;
	private set meltDownDelay(delay: number) {
		this._meltDownDelay = Math.max(0, delay);
	}
	private get meltDownDelay() {
		return this._meltDownDelay;
	}

	private _fireDelay: number = 0;
	private set fireDelay(delay: number) {
		this._fireDelay = Math.max(0, delay);
	}
	private get fireDelay() {
		return this._fireDelay;
	}

	private rods: Rods;
	private deltaTime: number;
	private reactorHealth: number;
	private readonly reactorMaxHealth: number;

	constructor(opts: ReactorOptions) {
		this.rods = opts.rods;
		this.maxPowerOutput = opts.rMax;
		this.deltaTime = 1 / opts.tickRate;
		this.fuelConsumptionRate = opts.fuelConsumptionRate || 0.2;
		this.meltDownDelay = opts.meltDownDelay || 120;
		this.fireDelay = opts.fireDelay || 20;
		this.reactorHealth = this.reactorMaxHealth = opts.reactorMaxHealth || 100;
	}

	private get fuelHeat() {
		return this.rods.reduce((heatValue, rod) => {
			if (rod === null) return heatValue;
			if (rod.durability !== 0) heatValue += rod.heat;
			return heatValue;
		}, 0);
	}

	public GetTemperature() {
		return this.temperature * 100;
	}
	public GetPower() {
		const temperatureFactor = Math.min(this.temperature / 50, 1);
		return this.maxPowerOutput * Math.min(this.turbineOutput / 100, temperatureFactor);
	}
	public GetFuel() {
		return this.fuelHeat;
	}
	public GetLoad() {
		return this.load;
	}

	public GetRods() {
		return [...this.rods];
	}
	public GetMaxPowerOutput() {
		return this.maxPowerOutput;
	}
	public GetTemperatureCritical() {
		const allowedTemperature = Lerp(70, 90, 0);
		return this.temperature > allowedTemperature;
	}
	public GetTemperatureHot() {
		const allowedTemperature = Lerp(30, 70, 0);
		return this.temperature > allowedTemperature;
	}
	private onFire: number = 0;
	public GetOnFire() {
		return this.onFire;
	}
	private melted: boolean = false;
	public GetMelted() {
		return this.melted;
	}
	public GetHealth() {
		return this.reactorHealth;
	}

	public GetHiddenFissionRate() {
		return this.fissionRate;
	}
	public GetHiddenTurbineOutput() {
		return this.turbineOutput;
	}

	private targetFissionRate: number = 0;
	private targetTurbineOutput: number = 0;

	private signalFissionRate: number | null = null;
	private signalTurbineOutput: number | null = null;

	public SetLoad(load: number) {
		this.load = load;
	}
	public SetFissionRate(rate: number | null) {
		this.signalFissionRate = rate;
	}
	public SetTurbineOutput(output: number | null) {
		this.signalTurbineOutput = output;
	}

	public tick(deltaTime?: number) {
		if (this.melted) return;

		deltaTime ??= this.deltaTime;

		if (this.signalFissionRate !== null) {
			this.targetFissionRate = adjustValueWithoutOverShooting(this.targetFissionRate, this.signalFissionRate, deltaTime * 5);
		}
		if (this.signalTurbineOutput !== null) {
			this.targetTurbineOutput = adjustValueWithoutOverShooting(this.targetTurbineOutput, this.signalTurbineOutput, deltaTime * 5);
		}

		const temperatureDiff = this.generatedHeat - this.turbineOutput - this.temperature;
		this.temperature += Clamp(Math.sign(temperatureDiff) * 10 * deltaTime, -Math.abs(temperatureDiff), Math.abs(temperatureDiff));

		this.fissionRate = Lerp(this.fissionRate, Math.min(this.targetFissionRate, this.fuelHeat), deltaTime);
		this.turbineOutput = Lerp(this.turbineOutput, this.targetTurbineOutput, deltaTime);

		if (this.fissionRate > 0) {
			for (const rod of this.rods) {
				if (rod === null) continue;
				rod.durability -= (this.fissionRate / 100) * this.fuelConsumptionRate * deltaTime;
				if (rod.durability < 0) rod.durability = 0;
			}
		}

		this.updateFaliures(deltaTime);
	}

	private meltDown() {
		this.melted = true;
		this.reactorHealth = 0;
		this.fireTimer = 0;
		this.meltDownTimer = 0;
		for (const rod of this.rods) {
			if (rod === null) continue;
			rod.durability = 0;
		}
	}

	private updateFaliures(deltaTime: number) {
		if (this.GetTemperatureCritical()) {
			this.meltDownTimer += Lerp(deltaTime * 2, deltaTime, this.reactorHealth / this.reactorMaxHealth);
			if (this.meltDownTimer > this.meltDownDelay) {
				this.meltDown();
				return;
			}
		} else {
			this.meltDownTimer = Math.max(0, this.meltDownTimer - deltaTime);
		}

		if (this.onFire === 0) {
			if (this.GetTemperatureHot()) {
				this.fireTimer += Lerp(deltaTime * 2, deltaTime, this.reactorHealth / this.reactorMaxHealth);
				if (this.fireTimer >= this.fireDelay) {
					this.onFire = 1;
					this.fireTimer = 0;
				}
			} else this.fireTimer = Math.max(0, this.fireTimer - deltaTime);
		} else {
			this.reactorHealth -= deltaTime * 10;
			if (this.reactorHealth <= 0) this.meltDown();
			this.onFire++;
		}
	}

	private get generatedHeat() {
		return this.fissionRate * (this.fuelHeat / 100) * 2;
	}
}

const Lerp = (a: number, b: number, amount: number) => a + (b - a) * amount;
const Clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const adjustValueWithoutOverShooting = (current: number, target: number, speed: number) => (target < current ? Math.max(target, current - speed) : Math.min(target, current + speed));
