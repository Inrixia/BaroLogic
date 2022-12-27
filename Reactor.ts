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

export class Reactor {
	private temperature: number = 0;
	private fissionRate: number = 0;
	private turbineOutput: number = 0;
	private load: number = 0;

	private fuelConsumptionRate: number = 0.2;

	private rods: Rods;

	public readonly maxPowerOutput;

	constructor(rMax: number, rods: Rods) {
		this.rods = rods;
		this.maxPowerOutput = rMax;
	}

	// public get availableFuel() {
	// 	return this.rods.reduce((durability, rod) => {
	// 		if (rod === null) return durability;
	// 		if (rod.durability !== 0) durability += rod.durability;
	// 		return durability;
	// 	}, 0);
	// }

	private get fuelHeat() {
		return this.rods.reduce((heatValue, rod) => {
			if (rod === null) return heatValue;
			if (rod.durability !== 0) heatValue += rod.heat;
			return heatValue;
		}, 0);
	}

	public get Temperature() {
		return this.temperature * 100;
	}
	public get FissionRate() {
		return this.fissionRate;
	}
	public get TurbineOutput() {
		return this.turbineOutput;
	}
	public get Power() {
		const temperatureFactor = Math.min(this.temperature / 50, 1);
		return -this.maxPowerOutput * Math.min(this.turbineOutput / 100, temperatureFactor);
	}
	public get Fuel() {
		return this.fuelHeat;
	}
	public get Load() {
		return this.load;
	}

	private targetFissionRate: number = 0;
	private targetTurbineOutput: number = 0;

	public SetLoad(load: number) {
		this.load = load;
	}
	public SetFissionRate(rate: number) {
		this.targetFissionRate = rate;
	}
	public SetTurbineOutput(output: number) {
		this.targetTurbineOutput = output;
	}

	tick(deltaTime: number = 1) {
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
	}

	private get generatedHeat() {
		return this.fissionRate * (this.fuelHeat / 100) * 2;
	}

	private get restingTemperature() {
		return this.generatedHeat - this.turbineOutput;
	}
}

const Lerp = (a: number, b: number, amount: number) => a + (b - a) * amount;
const Clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
