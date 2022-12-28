import { Lerp } from "../math";

export class Vector2 {
	public X: number;
	public Y: number;

	constructor(X: number, Y: number) {
		this.X = X;
		this.Y = Y;
	}

	public static Lerp(value1: Vector2, value2: Vector2, amount: number): Vector2 {
		return new Vector2(Lerp(value1.X, value2.X, amount), Lerp(value1.Y, value2.Y, amount));
	}
}
