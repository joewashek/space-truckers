import { Scene, Animation } from "@babylonjs/core";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { Observable } from "@babylonjs/core/Misc/observable";
import { ThinParticleSystem } from "babylonjs/Particles/thinParticleSystem";

class CutSceneSegment {
    private _onEnd = new Observable<AnimationGroup>();
    private _loopAnimation = false;
    private _target;
    private _animationGroup;
    private _scene: Scene;

    constructor(target: any, scene: Scene, ...animationSequence: Animation[]) {
        this._target = target;
        let ag = new AnimationGroup(target.name + "-animGroupCS", scene);
        for (var an of animationSequence) {
            ag.addTargetedAnimation(an, target);
        }

        this._animationGroup = ag;
        this._onEnd = ag.onAnimationGroupEndObservable;
        this._scene = scene;
    }

    get onEnd() {
        return this._onEnd;
    }

    public start() {
        this._animationGroup.start(this._loopAnimation);
    }

    public stop() {
        this._animationGroup.stop();
    }
}

export { CutSceneSegment };
