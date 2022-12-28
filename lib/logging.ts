import { PowerContainer } from "./classes/PowerContainer";
import { Powered } from "./classes/Powered";
import { Reactor } from "./classes/Reactor";

// Reactor
export const reactorText = (reactor: Reactor, tickRate: number) => `Power Value Out: ${reactor.GetPowerValueOut().toFixed(2)} kW
Fuel Out: ${reactor.GetFuelOut()}
Fuel Percentage Left: ${reactor.GetFuelPercentageLeft().toFixed(2)}%
Temperatur Out: ${(reactor.GetTemperatureOut() / 100).toFixed(2)}%
Load Value Out: ${reactor.GetLoadValueOut()} kW

Need More Fuel: ${reactor.needMoreFuel}
Too Much Fuel: ${reactor.tooMuchFuel}

[Turbine] - Real: ${reactor.turbineOutput.toFixed(2)}, Set: ${reactor.signalTurbineOutput?.toFixed(2)}
[Fission] - Real: ${reactor.fissionRate.toFixed(2)}, Set: ${reactor.signalFissionRate?.toFixed(2)}

Rods:${reactor.rods.map((rod) => {
	if (rod === null) return ` null`;
	return ` ${((rod.durability / rod.maxDurability) * 100).toFixed(2)}%`;
})}

Temperature Critical: ${reactor.temperatureCritical}
Temperature Hot: ${reactor.temperatureHot}
Meltdown Delay: ${reactor.meltDownDelay.toFixed(2)}
Fire Delay: ${reactor.fireDelay.toFixed(2)}

On Fire: ${reactor.onFire / tickRate}s
Health: ${reactor.reactorHealth}%

Melted: ${reactor.melted}
Is Powered On: ${reactor.powerOn}`;

// Battery
export const batteryText = (battery: PowerContainer) => `Power Value Out: ${battery.GetPowerValueOut().toFixed(2)} kW
Load Value Out: ${battery.GetLoadValueOut().toFixed(2)} kW
Charge: ${battery.GetCharge().toFixed(2)} kWmin
Charge %: ${battery.GetChargePrecentage().toFixed(2)}%
Load Value Out: ${battery.GetLoadValueOut().toFixed(2)} kW
Charge Rate: ${battery.GetChargeRate().toFixed(2)} %`;

// Grid
export const gridText = () => `Voltage: ${Powered.Grid.Voltage.toFixed(2)}v
Load: ${Powered.Grid.Load} Kw
Power: ${Powered.Grid.Power} Kw`;
