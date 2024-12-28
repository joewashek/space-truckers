import { Color3 } from "babylonjs";

export interface PlanetOptions {
    name: string;
    posRadians: number;
    posRadius: number;
    scale: number;
    color: Color3;
    rocky: boolean;
}
