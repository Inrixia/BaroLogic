export class Rolling {
	values: number[] = [];

	maxLength: number;

	constructor(maxLength: number) {
		this.maxLength = maxLength;
	}

	private addValue(value: number) {
		this.values.push(value);
		if (this.values.length > this.maxLength) this.values.shift();
	}

	avg(value: number) {
		this.addValue(value);
		return this.values.reduce((a, b) => a + b, 0) / this.values.length;
	}

	max(value: number) {
		this.addValue(value);
		return Math.max(...this.values);
	}

	min(value: number) {
		this.addValue(value);
		return Math.min(...this.values);
	}
}
