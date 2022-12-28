export type FuelRod = (Rod & { quality: Quality }) | null;

export const Rods = {
	Normal: {
		maxDurability: 100,
		durability: 100,
		heat: 80,
	},
	Thorium: {
		maxDurability: 200,
		durability: 200,
		heat: 100,
	},
	Fulgurium: {
		maxDurability: 150,
		durability: 150,
		heat: 150,
	},
	VolatileFulgurium: {
		maxDurability: 400,
		durability: 400,
		heat: 150,
	},
};

export enum Quality {
	Normal = 1,
	Good = 1.1,
	Excellent = 1.2,
	Masterwork = 1.3,
}
type Rod = typeof Rods[keyof typeof Rods];

export const Rod = (rod: Rod, quality: Quality): FuelRod => ({ ...rod, quality });
