import {
    Gamepad,
    KeyboardEventTypes,
    PointerEventTypes,
    Engine,
    Scene,
} from "@babylonjs/core";
import { Observable } from "@babylonjs/core/Misc/observable";
import logger from "./services/logger";

import SpaceTruckerControls from "./InputActionMap";

type InputRegistration = {
    scene: any;
    subscriptions: any[];
};

const controlsMap = SpaceTruckerControls.inputControlsMap;
class SpaceTruckerInputManager {
    private _onInputAvailable: Observable<{ action: string; lastEvent: any }[]>;
    private _inputSubscriptions: InputRegistration[] = [];
    private _inputMap: { [key: string]: any } = {};
    private _gamePad: any | null = null;
    private _gamePadOnButtonDown: any | null;
    private _gamePadOnButtonUp: any | null;
    private _inputKeys = [];

    get hasInput() {
        return this._inputKeys?.length > 0;
    }

    get inputMap() {
        if (!this._inputMap) {
            this._inputMap = {};
        }
        return this._inputMap;
    }

    get onInputAvailableObservable() {
        return this._onInputAvailable;
    }

    get inputSubscriptions() {
        if (!this._inputSubscriptions) {
            this._inputSubscriptions = [];
        }
        return this._inputSubscriptions;
    }
    constructor(private _engine: Engine) {
        this._onInputAvailable = new Observable();
    }

    registerInputForScene(sceneToRegister: Scene) {
        logger.logInfo("registering input for scene", sceneToRegister);
        const inputSubscriptions = this.inputSubscriptions;
        const registration: InputRegistration = {
            scene: sceneToRegister,
            subscriptions: [
                this.enableKeyboard(sceneToRegister),
                this.enableMouse(sceneToRegister),
                this.enableGamepad(sceneToRegister),
            ],
        };

        sceneToRegister.onDisposeObservable.add(() =>
            this.unregisterInputForScene(sceneToRegister)
        );
        inputSubscriptions.push(registration);
        sceneToRegister.attachControl();
    }

    unregisterInputForScene(sceneToUnregister: Scene) {
        logger.logInfo("unregistering input controls for scene");
        const subs = this.inputSubscriptions.find(
            (s) => s.scene === sceneToUnregister
        );
        if (!subs) {
            logger.logWarning("didn't find any subscriptions to unregister...");
            return;
        }
        subs.subscriptions.forEach((sub) => sub.dispose());
        sceneToUnregister.detachControl();
    }

    getInputs(scene: Scene) {
        const sceneInputHandler = this.inputSubscriptions.find(
            (is) => is.scene === scene
        );
        if (!sceneInputHandler) {
            return;
        }
        sceneInputHandler.subscriptions.forEach((s) => s.checkInputs());
        const im = this.inputMap;
        const ik = Object.keys(im);

        const inputs = ik.map((key: string) => {
            return { action: controlsMap[key], lastEvent: im[key] };
        });
        if (inputs && inputs.length > 0) {
            this.onInputAvailableObservable.notifyObservers(inputs);
        }
        return inputs;
    }

    enableMouse(scene: Scene) {
        const obs = scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                this.inputMap["PointerTap"] = pointerInfo.event;
            } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                if (this.inputMap["PointerTap"] != null) {
                    delete this.inputMap["PointerTap"];
                }
            }
        });

        const checkInputs = () => {};
        return {
            checkInputs,
            dispose: () => scene.onPointerObservable.remove(obs),
        };
    }

    enableKeyboard(scene: Scene) {
        const observer = scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key;
            const keyMapped = SpaceTruckerControls.inputControlsMap[key];

            if (!keyMapped) {
                return;
            }

            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                this.inputMap[key] = kbInfo.event;
            } else {
                delete this.inputMap[key];
            }
        });

        const checkInputs = () => {};
        return {
            checkInputs,
            dispose: () => {
                scene.onKeyboardObservable.remove(observer);
            },
        };
    }

    // adapted from
    // source: https://github.com/BabylonJS/Babylon.js/blob/preview/src/Cameras/Inputs/freeCameraGamepadInput.ts
    enableGamepad(scene: Scene) {
        const manager = scene.gamepadManager;
        const gamepadConnectedObserver =
            manager.onGamepadConnectedObservable.add((gamepad: any) => {
                console.log("gamepad connected", gamepad);
                // HACK: need to avoid selecting goofy non-gamepad devices reported by browser
                if (gamepad?.browserGamepad?.buttons.length > 0) {
                    if (gamepad.type !== Gamepad.POSE_ENABLED) {
                        // prioritize XBOX gamepads.
                        if (!this._gamePad || gamepad.type === Gamepad.XBOX) {
                            this._gamePad = gamepad;
                        }
                    }
                    const controlMap =
                        SpaceTruckerControls.gamePadControlMap[gamepad.type];
                    // how do we manage the observers here?
                    this._gamePadOnButtonDown =
                        gamepad.onButtonDownObservable.add(
                            (buttonId: any, s: any) => {
                                console.log("button down", buttonId, s);
                                const buttonMapped = controlMap[buttonId][0];
                                console.log(buttonMapped[0]);
                                this.inputMap[buttonMapped] = 1;
                            }
                        );
                    this._gamePadOnButtonUp = gamepad.onButtonUpObservable.add(
                        (buttonId: any, s: any) => {
                            console.log("button up", buttonId, s);
                            const buttonMapped = controlMap[buttonId][0];
                            delete this.inputMap[buttonMapped];
                        }
                    );
                }
            });

        const gamepadDisconnectedObserver =
            manager.onGamepadDisconnectedObservable.add((gamepad: any) => {
                gamepad.onButtonDownObservable.remove(
                    this._gamePadOnButtonDown
                );
                gamepad.onButtonUpObservable.remove(this._gamePadOnButtonUp);
                this._gamePad = null;
            });

        const checkInputs = () => {
            const iMap = this.inputMap;
            if (!this._gamePad) {
                return;
            }

            // handle quantitative or input that reads between 0 and 1
            // binary (on/off) inputs are handled by the onButton/ondPadUp|DownObservables

            let LSValues = SpaceTruckerControls.normalizeJoystickInputs(
                this._gamePad.leftStick
            );
            SpaceTruckerControls.mapStickTranslationInputToActions(
                LSValues,
                iMap
            );

            let RSValues = SpaceTruckerControls.normalizeJoystickInputs(
                this._gamePad.rightStick
            );
            SpaceTruckerControls.mapRotationInputToActions(RSValues, iMap);
        };

        // check if there are already other controllers connected
        this._gamePad = manager.gamepads.find(
            (gp) =>
                gp &&
                gp.type === Gamepad.XBOX &&
                gp.browserGamepad.buttons.length
        );

        // if no xbox controller was found, but there are gamepad controllers, take the first one
        if (!this._gamePad && manager.gamepads.length) {
            // HACK
            this._gamePad = manager.gamepads[0];
        }

        console.log("gamepad enabled", this._gamePad);

        return {
            checkInputs,
            dispose: () => {
                this._gamePad = null;
                manager.onGamepadConnectedObservable.remove(
                    gamepadConnectedObserver
                );
                manager.onGamepadDisconnectedObservable.remove(
                    gamepadDisconnectedObserver
                );
            },
        };
    }
}
export default SpaceTruckerInputManager;
