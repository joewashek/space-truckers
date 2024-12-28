import { Scene } from "@babylonjs/core";

export interface IApplicationScene {
    scene: Scene;
    update: (deltaTime: number | null) => void;
    attachControls: () => void;
    detachControls: () => void;
}
