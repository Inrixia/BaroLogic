import { PowerContainer } from "./classes/PowerContainer";
import { Powered } from "./classes/Powered";
import { Reactor } from "./classes/Reactor";

// Reactor
export const reactorText = (reactor: Reactor, tickRate: number) => `Power Value Out: ${reactor.GetPowerValueOut().toFixed(2)} kW
Fuel Out: ${reactor.GetFuelOut()}
Fuel Percentage Left: ${reactor.GetFuelPercentageLeft().toFixed(2)}%
Temperature Out: ${(reactor.GetTemperatureOut() / 100).toFixed(2)}%
Load Value Out: ${reactor.GetLoadValueOut().toFixed(2)} kW

Need More Fuel: ${reactor.needMoreFuel}
Too Much Fuel: ${reactor.tooMuchFuel}

[Turbine] - Real: ${reactor.turbineOutput.toFixed(2)}, Set: ${reactor.signalTurbineOutput?.toFixed(2)}
[Fission] - Real: ${reactor.fissionRate.toFixed(2)}, Set: ${reactor.signalFissionRate?.toFixed(2)}

Rods:${reactor.rods.map((rod) => {
	if (rod === null) return ` null`;
	return ` ${((rod.durability / rod.maxDurability) * 100).toFixed(2)}%`;
})}

Temperature Critical: ${reactor.temperatureCritical}
Meltdown In: ${(reactor.meltDownDelay - reactor.meltDownTimer).toFixed(2)}s

Temperature Hot: ${reactor.temperatureHot}
Fire In: ${(reactor.fireDelay - reactor.fireTimer).toFixed(2)}s
On Fire: ${reactor.onFire / tickRate}s

Health: ${reactor.reactorHealth.toFixed(2)}%

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
Load: ${Powered.Grid.Load.toFixed(2)} Kw
Power: ${Powered.Grid.Power.toFixed(2)} Kw`;