import {
    Mesh,
    MeshBuilder,
    Scalar,
    Scene,
    StandardMaterial,
    Texture,
    Animation,
} from "@babylonjs/core";
import distortTexture from "../../assets/textures/distortion.png";
import rockTextureN from "../../assets/textures/rockn.png";
import rockTexture from "../../assets/textures/rock.png";

const createPlanet = (opts: any, scene: Scene): Mesh => {
    let planet = MeshBuilder.CreateSphere(opts.name, { diameter: 1 }, scene);
    let mat = new StandardMaterial(planet.name + "-mat", scene);
    mat.diffuseColor = mat.specularColor = opts.color;
    mat.specularPower = 0;
    if (opts.rocky === true) {
        mat.bumpTexture = new Texture(rockTextureN, scene);
        mat.diffuseTexture = new Texture(rockTexture, scene);
    } else {
        mat.diffuseTexture = new Texture(distortTexture, scene);
    }

    planet.material = mat;
    planet.scaling.setAll(opts.scale);
    planet.position.x = opts.posRadius * Math.sin(opts.posRadians);
    planet.position.z = opts.posRadius * Math.cos(opts.posRadians);

    (planet as any).orbitOptions = opts;
    (planet as any).orbitAnimationObserver = createAndStartOrbitAnimation(
        planet,
        scene
    );

    return planet;
};

const createAndStartOrbitAnimation = (planet: any, scene: Scene) => {
    const Gm = 6672.59 * 0.07;
    const opts = planet.orbitOptions;
    const rCubed = Math.pow(opts.posRadius, 3);
    const period = Scalar.TwoPi * Math.sqrt(rCubed / Gm);
    const v = Math.sqrt(Gm / opts.posRadius);
    const w = v / period;

    let angPos = opts.posRadians;

    planet.orbitOptions.period = period;
    planet.orbitOptions.orbitalVel = v;
    planet.orbitOptions.angularVel = w;
    planet.orbitOptions.orbitalCircum = Math.pow(Math.PI * opts.posRadius, 2);
    planet.preRenderObsv = scene.onBeforeRenderObservable.add(() => {
        planet.position.x = opts.posRadius * Math.sin(angPos);
        planet.position.z = opts.posRadius * Math.cos(angPos);
        angPos = Scalar.Repeat(angPos + w, Scalar.TwoPi);
    });

    return planet;
};

const createSpinAnimation = () => {
    let orbitAnim = new Animation(
        "planetSpin",
        "rotation.y",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const keyFrames = [];
    keyFrames.push({
        frame: 0,
        value: 0,
    });
    keyFrames.push({
        frame: 60,
        value: Scalar.TwoPi,
    });
    orbitAnim.setKeys(keyFrames);
    return orbitAnim;
};

export { createPlanet, createSpinAnimation };
