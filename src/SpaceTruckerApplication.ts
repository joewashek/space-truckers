import { Engine, Scene } from "@babylonjs/core";
import * as AppStates from "./models/AppStates";
import logger from "./services/logger";
import { IApplicationScene } from "./scenes/IApplicationScene";
import MainMenuScene from "./scenes/MainMenuScene";
import SpaceTruckerInputManager from "./SpaceTruckerInput";
import { SplashScene } from "./scenes/SplashScene";

class SpaceTruckerApplication {
    private _currentScene: IApplicationScene | null = null;
    private _stateMachine: Generator<null, number | null, number>;
    private _mainMenu: MainMenuScene | null = null;
    private _splashScreen: SplashScene | null = null;
    private _inputManager: SpaceTruckerInputManager | null = null;

    *appStateMachine() {
        let previousState: number | null = null;
        let currentState: number | null = null;
        function setState(newState: number): number {
            previousState = currentState;
            currentState = newState;
            logger.logInfo(
                `App state changed. Previous state: ${previousState} - New state: ${newState}`
            );
            return newState;
        }

        while (true) {
            let nextState: number | null = yield currentState;
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

    constructor(private engine: Engine) {
        this._stateMachine = this.appStateMachine();
        this.moveNextAppState(AppStates.CREATED);
    }

    private initialize() {
        logger.logInfo("initializing application");
        this.engine.enterFullscreen(true);

        // note: this will be replaced with the call done internally from AssetManager at some point
        this.engine.displayLoadingUI();

        this.moveNextAppState(AppStates.INITIALIZING);

        this._inputManager = new SpaceTruckerInputManager(this.engine);

        this._splashScreen = new SplashScene(this.engine, this._inputManager);
        this._mainMenu = new MainMenuScene(this.engine, this._inputManager);
        this._splashScreen.onReadyObservable.addOnce(() => {
            this.goToOpeningCutscene();
        });

        this._mainMenu.onExitActionObservable.addOnce(() => this.exit());
        this._mainMenu.onPlayActionObservable.add(() =>
            this.goToRunningState()
        );
    }

    public run() {
        this.initialize();

        this.engine.runRenderLoop(() => this.onRender());
    }

    private onRender() {
        // update loop. Inputs are routed to the active state's scene.
        let state = this.currentState;

        switch (state) {
            case AppStates.CREATED:
            case AppStates.INITIALIZING:
                break;
            case AppStates.CUTSCENE:
                if (this._splashScreen?.skipRequested) {
                    this.goToMainMenu();
                    logger.logInfo(
                        "in application onRender - skipping splash screen message"
                    );
                }
                this._splashScreen?.update();

                break;
            case AppStates.MENU:
                this._mainMenu?.update(null);

                break;
            case AppStates.RUNNING:
                break;
            case AppStates.EXITING:
                break;
            default:
                break;
        }

        // render
        this.activeScene?.scene?.render();
    }

    private goToOpeningCutscene() {
        console.log("goToOpeningCutscene");
        this.moveNextAppState(AppStates.CUTSCENE);

        this.engine.hideLoadingUI();
        console.log("attaching splash screen controls");
        this._splashScreen?.attachControls();
        this._currentScene = this._splashScreen;
        this._splashScreen?.run();
    }

    private goToMainMenu() {
        this._splashScreen?.detachControls();
        this._currentScene = this._mainMenu;
        this.moveNextAppState(AppStates.MENU);
        this._mainMenu?.attachControls();
    }

    private goToRunningState() {
        this._mainMenu?.detachControls();
        this.moveNextAppState(AppStates.RUNNING);
    }

    private exit() {
        logger.logInfo("exiting app");
        this.engine.exitFullscreen();
        this.moveNextAppState(AppStates.EXITING);
        if (window) {
            this.engine.dispose();
            window.location?.reload();
        }
    }
}

export default SpaceTruckerApplication;
