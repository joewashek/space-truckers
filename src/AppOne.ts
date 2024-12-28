import { Engine, Scene } from "@babylonjs/core";
import { StartScene } from "./scenes/StartScene";
import SpaceTruckerLoadingScreen from "./scenes/SpaceTruckerLoadingScreen";
import logger from "./services/logger";

export class AppOne {
    engine: Engine;
    scene: Scene;

    constructor(readonly canvas: HTMLCanvasElement) {
        logger.logInfo("Starting game engine");
        this.engine = new Engine(canvas, true, undefined, true);
        logger.logInfo("Loading screen...");
        this.engine.loadingScreen = new SpaceTruckerLoadingScreen(this.engine);

        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        this.scene = StartScene.CreateScene(this.engine);
    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}
