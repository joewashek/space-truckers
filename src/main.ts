import { Engine } from "@babylonjs/core";
import logger from "./services/logger";
import SpaceTruckerLoadingScreen from "./scenes/SpaceTruckerLoadingScreen";
import SpaceTruckerApplication from "./SpaceTruckerApplication";
const CanvasName = "index-canvas";

const launchButton = document.getElementById("btnLaunch");
const pageLandingContent = document.getElementById("pageContainer");

window.addEventListener("DOMContentLoaded", () => {
    let canvas = document.createElement("canvas");
    canvas.id = CanvasName;
    canvas.classList.add("background-canvas");
    document.body.appendChild(canvas);

    const eng = new Engine(canvas, true, undefined, true);
    logger.logInfo("Created BJS engine");

    eng.loadingScreen = new SpaceTruckerLoadingScreen(eng);

    const theApp = new SpaceTruckerApplication(eng);

    const launchBtnClickHandle = () => {
        console.log("clicked");
        logger.logInfo("Launch button clicked. Initializing application.");
        canvas.classList.remove("background-canvas");
        if (pageLandingContent) {
            pageLandingContent.style.display = "none";
        }

        launchButton?.removeEventListener("click", launchBtnClickHandle);

        theApp.run();
    };
    launchButton?.addEventListener("click", launchBtnClickHandle);

    window.addEventListener("resize", () => {
        eng.resize();
    });
});
