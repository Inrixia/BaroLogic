import { PowerPriority, PowerRange } from "./Power";
import { Grid } from "./Grid";
import { Simulated } from "./Simulated";

export enum GridDirection {
	Power,
	Load,
}

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

	/**
	 * Maximum voltage factor when the device is being overvolted. I.e. how many times more effectively the device can function when it's being overvolted
	 */
	protected readonly MaxOverVoltageFactor = 2;

	/**
	 * Priority of this device on the network.
	 */
	protected powerPriority: PowerPriority;

	/**
	 * List of all powered Devices
	 */
	public static readonly PoweredList: Powered[] = [];

	/**
	 * Arrays of all powered Devices by priority
	 */
	public static readonly PoweredListByPriority: Record<PowerPriority, Powered[]> = {
		[PowerPriority.Default]: [],
		[PowerPriority.Reactor]: [],
		[PowerPriority.Relay]: [],
		[PowerPriority.Battery]: [],
	};

	/**
	 * The grid to use for all Devices
	 */
	public static readonly Grid: Grid = new Grid();

	private _isActive: boolean = false;
	private _minVoltage: number = 0;

	/**
	 * Current voltage of the item (load / power)
	 */
	protected get voltage() {
		return Powered.Grid.Voltage;
	}

	/**
	 * The minimum voltage required for the item to work
	 */

	protected set minVoltage(voltage: number) {
		this._minVoltage = voltage;
	}
	protected get minVoltage() {
		return this.powerConsumption <= 0 ? 0 : this._minVoltage;
	}

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

	constructor(powerPriority: PowerPriority = PowerPriority.Default) {
		super();
		this.powerPriority = powerPriority;
		Powered.PoweredList.push(this);
		Powered.PoweredListByPriority[powerPriority].push(this);
	}

	/**
	 * Current power consumption of the device (or amount of generated power if negative)
	 */
	protected GetCurrentPowerConsumption(deltaTime: number) {
		if (!this.isActive) return 0;
		// Otherwise return the max powerconsumption of the device
		return this.powerConsumption;
	}

	/**
	 * Minimum and maximum power the connection can provide
	 * @param load Load of the connected grid
	 */
	protected MinMaxPowerOut(load: number, deltaTime: number): PowerRange {
		return PowerRange.Zero;
	}

	/**
	 * Finalize how much power the device will be outputting to the connection
	 * @param power Current grid power
	 * @param load Current load on the grid
	 * @returns Power pushed to the grid
	 */
	protected GetPowerOut(power: number, load: number, minMaxPower: PowerRange, deltaTime: number): number {
		return Math.max(-this.currPowerConsumption, 0);
	}

	/**
	 * Can be overridden to perform updates for the device after the connected grid has resolved its power calculations, i.e. storing voltage for later updates
	 */
	protected GridResolved(deltaTime: number) {}

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

		const srcMinMax = PowerRange.Zero;

		// Device consumed power
		for (const powered of Powered.PoweredList) {
			const currLoad = powered.GetCurrentPowerConsumption(deltaTime);

			powered.currPowerConsumption = currLoad;
			Powered.Grid.Load += currLoad;
		}

		for (const powered of Powered.PoweredList) {
			srcMinMax.Add(powered.MinMaxPowerOut(Powered.Grid.Load, deltaTime));
		}

		// Device produced power
		for (const priorityList of Object.values(Powered.PoweredListByPriority)) {
			let addPower = 0;
			for (const powered of priorityList) {
				addPower += powered.GetPowerOut(Powered.Grid.Power, Powered.Grid.Load, srcMinMax, deltaTime);
			}
			Powered.Grid.Power += addPower;
		}

		// Calculate Grid voltage, limit between 0 - 1000
		Powered.Grid.Voltage = Math.min(Powered.Grid.Power / Math.max(Powered.Grid.Load, 1e-10), 1000);
		if (Math.sign(Powered.Grid.Voltage) === -1) Powered.Grid.Voltage = 0;

		for (const powered of Powered.PoweredList) {
			powered.GridResolved(deltaTime);
		}

		Powered.Grid.UpdateFaliures(deltaTime);
	}
}
