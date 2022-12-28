import { PowerPriority, PowerRange } from "./Power";
import { Grid } from "./Grid";
import { Simulated } from "./Simulated";

export class Powered extends Simulated {
	/**
	 * The amount of power currently consumed by the item. Negative values mean that the item is providing power to connected items
	 */
	protected currPowerConsumption: number = 0;

	/**
	 * The maximum amount of power the item can draw from connected items
	 */
	protected maxPowerConsumption: number = 0;

	/**
	 * How much power the device draws (or attempts to draw) from the electrical grid when active.
	 */
	private powerConsumption: number = 0;

	private _voltage: number = 0;
	/**
	 * Current voltage of the item (load / power)
	 */
	// protected set voltage(voltage: number) {
	// 	this._voltage = Math.max(0, voltage);
	// }
	protected get voltage() {
		return Powered.Grid.Voltage;
	}

	/**
	 * The minimum voltage required for the item to work
	 */
	private _minVoltage: number = 0;
	protected set minVoltage(voltage: number) {
		this._minVoltage = voltage;
	}
	protected get minVoltage() {
		return this.powerConsumption <= 0 ? 0 : this._minVoltage;
	}

	private _isActive: boolean = false;
	/**
	 * Is the device currently active. Inactive devices don't consume power.
	 */
	protected set isActive(active: boolean) {
		this._isActive = active;
		if (!active) this.powerConsumption = 0;
	}
	protected get isActive(): boolean {
		return this._isActive;
	}

	/**
	 * Maximum voltage factor when the device is being overvolted. I.e. how many times more effectively the device can function when it's being overvolted
	 */
	protected readonly MaxOverVoltageFactor = 2;

	protected powerPriority: PowerPriority;

	/**
	 * List of all powered ItemComponents
	 */
	public static readonly PoweredList: Powered[] = [];
	public static readonly Grid: Grid = new Grid();

	constructor(powerPriority: PowerPriority = PowerPriority.Default) {
		super();
		this.powerPriority = powerPriority;
		Powered.PoweredList.push(this);
		Powered.PoweredList.sort((a, b) => b.powerPriority - a.powerPriority);
	}

	/**
	 * Current power consumption of the device (or amount of generated power if negative)
	 */
	public GetCurrentPowerConsumption(deltaTime: number) {
		if (!this.isActive) return 0;
		// Otherwise return the max powerconsumption of the device
		return this.powerConsumption;
	}

	/**
	 * /**
	 * Minimum and maximum power the connection can provide
	 * @param load Load of the connected grid
	 */
	public MinMaxPowerOut(load: number, deltaTime: number): PowerRange {
		return PowerRange.Zero;
	}

	/**
	 * Finalize how much power the device will be outputting to the connection
	 * @param power Current grid power
	 * @param load Current load on the grid
	 * @returns Power pushed to the grid
	 */
	public GetPowerOut(power: number, load: number, minMaxPower: PowerRange, deltaTime: number): number {
		return Math.max(-this.currPowerConsumption, 0);
	}

	/**
	 * Update the power calculations of all devices and grids
	 * Updates grids in the order of
	 * ConnCurrConsumption - Get load of device/ flag it as an outputting connection
	 * -- If outputting power --
	 * MinMaxPower - Minimum and Maximum power output of the connection for devices to coordinate
	 * ConnPowerOut - Final power output based on the sum of the MinMaxPower
	 * -- Finally --
	 * GridResolved - Indicate that a connection's grid has been finished being calculated
	 * Power outputting devices are calculated in stages based on their priority
	 * Reactors will output first, followed by relays then batteries.
	 */
	public static UpdatePower(deltaTime: number) {
		Powered.Grid.Voltage = 0;
		Powered.Grid.Load = 0;
		Powered.Grid.Power = 0;

		// Determine if devices are adding a load or providing power, also resolve solo nodes
		for (const powered of Powered.PoweredList) {
			// // Make voltage decay to ensure the device powers down.
			// // This only effects devices with no power input (whose voltage is set by other means, e.g. status effects from a contained battery)
			// // or devices that have been disconnected from the power grid - other devices use the voltage of the grid instead.
			// powered.voltage -= deltaTime;

			// Get the new load for the connection
			const currLoad = powered.GetCurrentPowerConsumption(deltaTime);

			// Device consumed power
			powered.currPowerConsumption = currLoad;
			Powered.Grid.Load += currLoad;

			// Device produced power
			Powered.Grid.Power += powered.GetPowerOut(Powered.Grid.Power, Powered.Grid.Load, powered.MinMaxPowerOut(Powered.Grid.Load, deltaTime), deltaTime);
		}

		// Calculate Grid voltage, limit between 0 - 1000
		Powered.Grid.Voltage = Math.min(Powered.Grid.Power / Math.max(Powered.Grid.Load, 1e-10), 1000);
		if (Math.sign(Powered.Grid.Voltage) === -1) Powered.Grid.Voltage = 0;

		for (const powered of Powered.PoweredList) {
			powered.GridResolved(deltaTime);
		}

		Powered.Grid.UpdateFaliures(deltaTime);
	}

	public GridResolved(deltaTime: number) {}
}
