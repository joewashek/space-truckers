import { Engine, Scene } from "@babylonjs/core";
import * as AppStates from "./models/AppStates";
import logger from "./services/logger";
import { IApplicationScene } from "./scenes/IApplicationScene";
import MainMenuScene from "./scenes/MainMenuScene";

class SpaceTruckerApplication {
    private _currentScene: Scene | null = null;
    private _stateMachine: Generator<undefined, number | null, number>;
    private _mainMenu: IApplicationScene | null = null;
    constructor(private engine: Engine) {
        this._stateMachine = this.appStateMachine();
        this.moveNextAppState(AppStates.CREATED);
    }

    *appStateMachine(): Generator<undefined, number | null, number> {
        let previousState: number | null = null;
        let currentState: number | null = null;
        function setState(newState: number) {
            previousState = currentState;
            currentState = newState;
            logger.logInfo(
                `App state changed. Previous state: ${previousState} - New state: ${newState}`
            );
            return newState;
        }

        while (true) {
            let nextState = yield;
            if (nextState !== null && nextState !== undefined) {
                setState(nextState);
                if (nextState === AppStates.EXITING) {
                    return currentState;
                }
            }
        }
    }

    get currentState() {
        return this._stateMachine.next().value;
    }

    get activeScene() {
        return this._currentScene;
    }

    public moveNextAppState(state: number) {
        return this._stateMachine.next(state).value;
    }

    public async run() {
        await this.initialize();
        await this.goToMainMenu();

        this.engine.runRenderLoop(() => {
            let state = this.currentState;
            switch (state) {
                case AppStates.CREATED:
                case AppStates.INITIALIZING:
                    break;
                case AppStates.CUTSCENE:
                    logger.logInfo("App State: Cutscene");
                    break;
                case AppStates.MENU:
                    this._currentScene = this._mainMenu!.scene;
                    break;
                case AppStates.RUNNING:
                    this.goToOpeningCutscene();
                    break;
                case AppStates.EXITING:
                    this.exit();
                    break;
                default:
                    break;
            }
            this._currentScene?.render();
        });
    }

    private async initialize(): Promise<void> {
        logger.logInfo("initializing application");
        this.engine.enterFullscreen(true);

        // note: this will be replaced with the call done internally from AssetManager at some point
        this.engine.displayLoadingUI();

        this.moveNextAppState(AppStates.INITIALIZING);

        const p = new Promise<void>((res, rej) => {
            setTimeout(() => res(), 5000);
        });
        await p;

        logger.logInfo("initializing application done, hiding loading UI");
        this.engine.hideLoadingUI();
    }

    private goToOpeningCutscene() {
        this.engine.displayLoadingUI();
        this.moveNextAppState(AppStates.CUTSCENE);

        return Promise.resolve().then(() => this.engine.hideLoadingUI());
    }

    private goToMainMenu() {
        this.engine.displayLoadingUI();
        this._mainMenu = new MainMenuScene(this.engine);
        this._currentScene = this._mainMenu.scene;
        this.engine.hideLoadingUI();
        this.moveNextAppState(AppStates.MENU);

        return Promise.resolve().then(() => this.engine.hideLoadingUI());
    }

    private exit() {
        logger.logInfo("exiting app");
    }
}

export default SpaceTruckerApplication;
