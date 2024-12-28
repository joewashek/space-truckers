import {
    Engine,
    Scene,
    Animation,
    Observable,
    Color3,
    Color4,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    CreatePlane,
    Mesh,
    StandardMaterial,
    Texture,
    Sound,
} from "@babylonjs/core";
import {
    AdvancedDynamicTexture,
    TextBlock,
    TextWrapping,
} from "@babylonjs/gui";
import { IApplicationScene } from "./IApplicationScene";

import poweredByUrl from "../../assets/powered-by.png";
import titleSongUrl from "../../assets/sounds/space-trucker-title-theme.m4a";
import communityUrl from "../../assets/splash-screen-community.png";
import spaceTruckerRigUrl from "../../assets/space-trucker-and-rig.png";
import babylonLogoUrl from "../../assets/babylonjs_identity_color.png";
import { CutSceneSegment } from "./CutSceneSegment";
import logger from "../services/logger";
import { ActionListItem } from "../models/controls";
import { SpaceTruckerInputProcessor } from "../SpaceTruckerInputProcessor";
import SpaceTruckerInputManager from "../SpaceTruckerInput";

const animationFps = 30;
const flipAnimation = new Animation(
    "flip",
    "rotation.x",
    animationFps,
    Animation.ANIMATIONTYPE_FLOAT,
    0,
    true
);
const fadeAnimation = new Animation(
    "entranceAndExitFade",
    "visibility",
    animationFps,
    Animation.ANIMATIONTYPE_FLOAT,
    0,
    true
);
const scaleAnimation = new Animation(
    "scaleTarget",
    "scaling",
    animationFps,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CYCLE,
    true
);

const actionList: ActionListItem[] = [
    {
        action: "ACTIVATE",
        shouldBounce: () => true,
    },
];

class SplashScene implements IApplicationScene {
    private _scene: Scene;
    private _skipRequested: boolean = false;
    private _onReadyObservable = new Observable();
    private _camera: ArcRotateCamera;
    private _light: HemisphericLight;
    private _billboard: Mesh;
    private _billMat: StandardMaterial;
    private _callToActionTexture: AdvancedDynamicTexture;
    private _poweredBy: CutSceneSegment;
    private _babylonBillboard: CutSceneSegment;
    private _communityProduction: CutSceneSegment;
    private _callToAction: CutSceneSegment;
    private _currentSegment: CutSceneSegment | null = null;
    private _ctaBlock: TextBlock;
    private _music: Sound;
    private _actionProcessor: SpaceTruckerInputProcessor;

    constructor(engine: Engine, inputManager: SpaceTruckerInputManager) {
        this._scene = new Scene(engine);
        this._scene.clearColor = Color4.FromColor3(Color3.Black());
        this._camera = new ArcRotateCamera(
            "camera",
            0,
            Math.PI / 2,
            5,
            Vector3.Zero(),
            this._scene
        );
        this._light = this.createLight();
        this._billMat = new StandardMaterial("stdMat", this._scene);
        this._billboard = this.createBillboard();
        this._ctaBlock = new TextBlock(
            "ctaBlock",
            "Press any key or tap the screen to continue..."
        );
        this._callToActionTexture = this.createCallToAction();

        const babylonTexture = new Texture(babylonLogoUrl, this._scene);
        const communityTexture = new Texture(communityUrl, this._scene);
        const rigTexture = new Texture(spaceTruckerRigUrl, this._scene);

        this._poweredBy = this.buildPoweredByAnimations();
        this._babylonBillboard = this.buildBabylonAnimations();
        this._communityProduction = this.buildCommunityProductionAnimations();
        this._callToAction = this.buildcallToActionAnimation();

        this._poweredBy.onEnd.addOnce(() => {
            console.log("powered End");
            this._billMat.diffuseTexture = babylonTexture;
            this._billboard.rotation.x = Math.PI;
            this._light.intensity = 0.667;
            this._billboard.visibility = 0;
            this._currentSegment = this._babylonBillboard;
        });

        this._babylonBillboard.onEnd.addOnce(() => {
            console.log("babylonEnd");
            this._billMat.diffuseTexture = communityTexture;
            this._billboard.rotation.x = Math.PI;
            this._billboard.visibility = 0;
            this._currentSegment = this._communityProduction;
        });

        this._communityProduction.onEnd.addOnce(() => {
            console.log("communityEnd");
            this._billboard.visibility = 0;
            this._currentSegment = this._callToAction;
            this._billMat.diffuseTexture = rigTexture;
        });

        this._callToAction.onEnd.addOnce(() => {
            console.log("callToAction end");
            this._ctaBlock.isVisible = true;
        });

        this._music = new Sound(
            "theme",
            titleSongUrl,
            this._scene,
            () => {
                this._onReadyObservable.notifyObservers(0);
            },
            { autoplay: false, loop: false, volume: 0.01 }
        );

        this._actionProcessor = new SpaceTruckerInputProcessor(
            this,
            inputManager,
            actionList
        );
    }
    public attachControls() {
        this._actionProcessor.attachControl();
    }

    public detachControls() {
        this._actionProcessor.detachControl();
    }

    private createLight(): HemisphericLight {
        const light = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            this._scene
        );
        light.groundColor = Color3.White();
        light.intensity = 0.5;
        return light;
    }

    private createBillboard(): Mesh {
        const billboard = CreatePlane(
            "billboard",
            {
                width: 5,
                height: 3,
            },
            this._scene
        );
        billboard.rotation.z = Math.PI;
        billboard.rotation.x = Math.PI;
        billboard.rotation.y = Math.PI / 2;

        billboard.material = this._billMat;

        const poweredTexture = new Texture(poweredByUrl, this._scene);
        this._billMat.diffuseTexture = poweredTexture;
        return billboard;
    }

    private createCallToAction(): AdvancedDynamicTexture {
        const cta = AdvancedDynamicTexture.CreateFullscreenUI("splashGui");

        // this._ctaBlock = new TextBlock(
        //     "ctaBlock",
        //     "Press any key or tap the screen to continue..."
        // );
        this._ctaBlock.textWrapping = TextWrapping.WordWrap;
        this._ctaBlock.color = "white";
        this._ctaBlock.fontSize = "18pt";
        this._ctaBlock.verticalAlignment = TextBlock.VERTICAL_ALIGNMENT_BOTTOM;
        this._ctaBlock.textVerticalAlignment =
            TextBlock.VERTICAL_ALIGNMENT_BOTTOM;
        this._ctaBlock.paddingBottom = "12%";
        this._ctaBlock.isVisible = false;
        cta.addControl(this._ctaBlock);

        return cta;
    }

    private buildcallToActionAnimation() {
        const start = 0;
        const enterTime = 3.0;
        const exitTime = enterTime + 2.5;
        const end = exitTime + 3.0;
        const entranceFrame = enterTime * animationFps;
        const beginExitFrame = exitTime * animationFps;
        const endFrame = end * animationFps;
        const keys = [
            { frame: start, value: 0 },
            { frame: entranceFrame, value: 1 },
            { frame: beginExitFrame, value: 0.998 },
            { frame: endFrame, value: 1 },
        ];

        const startVector = new Vector3(1, 1, 1);
        const scaleKeys = [
            { frame: start, value: startVector },
            { frame: entranceFrame, value: new Vector3(1.25, 1, 1.25) },
            { frame: beginExitFrame, value: new Vector3(1.5, 1, 1.5) },
            { frame: endFrame, value: new Vector3(1, 1, 1) },
        ];

        fadeAnimation.setKeys(keys);
        scaleAnimation.setKeys(scaleKeys);

        const seg = new CutSceneSegment(
            this._billboard,
            this.scene,
            fadeAnimation,
            scaleAnimation
        );
        return seg;
    }

    private buildCommunityProductionAnimations() {
        const start = 0;
        const enterTime = 4.0;
        const exitTime = enterTime + 2.5;
        const end = exitTime + 3.0;
        const entranceFrame = enterTime * animationFps;
        const beginExitFrame = exitTime * animationFps;
        const endFrame = end * animationFps;
        const keys = [
            { frame: start, value: 0 },
            { frame: entranceFrame, value: 1 },
            { frame: beginExitFrame, value: 0.998 },
            { frame: endFrame, value: 0 },
        ];

        fadeAnimation.setKeys(keys);

        const seg2 = new CutSceneSegment(
            this._billboard,
            this.scene,
            fadeAnimation
        );
        return seg2;
    }

    private buildBabylonAnimations() {
        const start = 0;
        const enterTime = 2.5;
        const exitTime = enterTime + 2.5;
        const end = exitTime + 2.5;
        const entranceFrame = enterTime * animationFps;
        const beginExitFrame = exitTime * animationFps;
        const endFrame = end * animationFps;
        const keys = [
            { frame: start, value: 0 },
            { frame: entranceFrame, value: 1 },
            { frame: beginExitFrame, value: 0.998 },
            { frame: endFrame, value: 0 },
        ];
        fadeAnimation.setKeys(keys);

        const seg1 = new CutSceneSegment(
            this._billboard,
            this.scene,
            fadeAnimation
        );
        return seg1;
    }

    private buildPoweredByAnimations() {
        const start = 0;
        const enterTime = 3.5;
        const exitTime = enterTime + 2.5;
        const end = exitTime + 2.5;

        const entranceFrame = enterTime * animationFps;
        const beginExitFrame = exitTime * animationFps;
        const endFrame = end * animationFps;
        const keys = [
            { frame: start, value: 0 },
            { frame: entranceFrame, value: 1 },
            { frame: beginExitFrame, value: 0.998 },
            { frame: endFrame, value: 0 },
        ];
        fadeAnimation.setKeys(keys);

        const flipKeys = [
            { frame: start, value: Math.PI },
            { frame: entranceFrame, value: 0 },
            { frame: beginExitFrame, value: Math.PI },
            { frame: endFrame, value: 2 * Math.PI },
        ];
        flipAnimation.setKeys(flipKeys);

        const seg0 = new CutSceneSegment(
            this._billboard,
            this.scene,
            fadeAnimation,
            flipAnimation
        );
        return seg0;
    }

    public run() {
        this._currentSegment = this._poweredBy;
        this._music.play();
        this._music.setVolume(0.998, 400);
        this._currentSegment.start();
        // this.scene.onBeforeRenderObservable.add(() => {
        //     this.update
        // });
    }

    update() {
        let prior,
            curr = this._currentSegment;
        this._actionProcessor?.update();
        if (this._skipRequested) {
            this?._currentSegment?.stop();
            this._currentSegment = null;
            return;
        }
        curr = this._currentSegment;
        if (prior !== curr) {
            this._currentSegment?.start();
        }
    }

    ACTIVATE(state: any) {
        console.log("splash screen ACTIVATE", state);
        const lastState = state.priorState;
        if (!this._skipRequested && !lastState) {
            logger.logInfo("Key press detected. Skipping cut scene.");
            this._skipRequested = true;
            return true;
        }
        return false;
    }

    get scene(): Scene {
        return this._scene;
    }

    get onReadyObservable() {
        return this._onReadyObservable;
    }

    get skipRequested() {
        return this._skipRequested;
    }
}

export { SplashScene };
