export const Lerp = (a: number, b: number, amount: number) => a + (b - a) * amount;
export const Clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
export const adjustValueWithoutOverShooting = (current: number, target: number, speed: number) => (target < current ? Math.max(target, current - speed) : Math.min(target, current + speed));
export const RoundTowardsClosest = (value: number, div: number) => Math.round(value / div) * div;
export const NearlyEqual = (a: number, b: number, epsilon = 0.0001): boolean => {
	const diff = Math.abs(a - b);
	// shortcut, handles infinities
	if (a == b) return true;
	else if (a == 0 || b == 0 || diff < 1.192092896e-7) {
		// a or b is zero or both are extremely close to it
		// relative error is less meaningful here
		return diff < epsilon;
		// use relative error
	} else return diff / (Math.abs(a) + Math.abs(b)) < epsilon;
};
