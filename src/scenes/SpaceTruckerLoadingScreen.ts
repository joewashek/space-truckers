import { Engine, Scene, ILoadingScreen } from "@babylonjs/core";
import { AdvancedDynamicTexture, Container, TextBlock } from "@babylonjs/gui";
import { StartScene } from "./StartScene";

export default class SpaceTruckerLoadingScreen implements ILoadingScreen {
    private _totalToLoad: number = 0.0;
    private loadingText: string = "Loading Space Truckers: The Video Game...";
    private _currentAmountLoaded = 0.0;
    private _progressAvailable: boolean = false;
    private startScene: Scene;
    private textContainer: AdvancedDynamicTexture;
    private active: boolean = false;

    constructor(engine: Engine) {
        this.startScene = StartScene.CreateScene(engine);
        this.active = true;

        this.textContainer = AdvancedDynamicTexture.CreateFullscreenUI(
            "loadingUI",
            true,
            this.startScene
        );
        const textBlock = new TextBlock("textBlock", this.loadingText);
        textBlock.fontSize = "62pt";
        textBlock.color = "antiquewhite";
        textBlock.verticalAlignment = Container.VERTICAL_ALIGNMENT_BOTTOM;
        textBlock.paddingTop = "15%";
        this.textContainer.addControl(textBlock);

        engine.runRenderLoop(() => {
            if (this.startScene && this.active) {
                this.startScene.render();
            }
        });
    }

    get progressAvailable(): boolean {
        return this._progressAvailable;
    }

    get currentAmountLoaded(): number {
        return this._currentAmountLoaded;
    }

    get totalToLoad(): number {
        return this._totalToLoad;
    }

    get loadingUIText(): string {
        return this.loadingText;
    }

    get loadingUIBackgroundColor(): string {
        return "green";
    }

    public displayLoadingUI() {
        this.active = true;
    }

    public hideLoadingUI() {
        this.active = false;
    }

    public onProgressHandler(evt: any) {
        this._progressAvailable = evt.lengthComputable === true;
        this._currentAmountLoaded = evt.loaded || this.currentAmountLoaded;
        this._totalToLoad = evt.total || this.currentAmountLoaded;
        if (this._progressAvailable) {
            const progress = (
                (this._currentAmountLoaded / this._totalToLoad) *
                100
            ).toFixed(2);
            this.loadingText =
                "Loading Space-Truckers: The Video Game..." + progress;
        }
    }
}
