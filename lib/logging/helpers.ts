import { SimInfo } from "../Simulator";
import { LogHelper } from "./LogHelper";

export const txt = (previous: number, current: number, units: string) => `${current.toFixed(2)} ${units} (${Math.sign(current - previous) > 0 ? "-" : "+"}${(previous - current).toFixed(2)} ${units})`;

export type Value = number | boolean | null | string;
export type Generator = (simInfo: SimInfo) => Value;
export const isNum = (value: unknown): value is number => typeof value === "number";

const rnd = (value: number) => ~~(value * 100) / 100;

export type Logger = ((simInfo: SimInfo) => string) | LogHelper;
