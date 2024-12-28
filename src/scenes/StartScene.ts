import { StarfieldProceduralTexture } from "@babylonjs/procedural-textures";
import {
    Scene,
    Engine,
    Vector3,
    ArcRotateCamera,
    GlowLayer,
    Texture,
    PointLight,
    Color3,
    Mesh,
    MeshBuilder,
    StandardMaterial,
    Scalar,
} from "@babylonjs/core";

// imported for side-effect only
import "@babylonjs/core/Helpers/sceneHelpers";

import distortTexture from "../../assets/textures/distortion.png";
import { PlanetOptions } from "../models";
import * as AstroFactory from "../models/astroFactory";

export class StartScene {
    public static CreateScene(engine: Engine): Scene {
        const stuff = this.createStartScene(engine);
        return stuff.scene;
    }

    private static createStartScene(engine: Engine) {
        const scene = new Scene(engine);
        let that: any = {};
        that.scene = scene;
        let camAlpha = 2.79;
        let camBeta = Math.PI / 4;
        let camDist = 350;
        let camTarget = new Vector3(10, 0, -30);
        let camera = (that.camera = new ArcRotateCamera(
            "camera1",
            camAlpha,
            camBeta,
            camDist,
            camTarget,
            scene
        ));

        that.camera = camera;

        let env = this.setupEnvironment(scene);
        let star = (that.star = this.createStar(scene));
        let planets: Mesh[] = (that.planets =
            this.populatePlanetarySystem(scene));

        let glowLayer = new GlowLayer("glowLayer", scene);

        let spinAnim = AstroFactory.createSpinAnimation();
        star.animations.push(spinAnim);
        scene.beginAnimation(star, 0, 60, true);
        planets.forEach((p) => {
            glowLayer.addExcludedMesh(p);
            p.animations.push(spinAnim);
            scene.beginAnimation(p, 0, 60, true, Scalar.RandomRange(0.1, 3));
        });

        camera.attachControl(true);
        return that;
    }

    private static setupEnvironment(scene: Scene) {
        let starFieldPT = new StarfieldProceduralTexture(
            "starfieldPT",
            512,
            scene
        );
        starFieldPT.coordinatesMode =
            Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE;
        starFieldPT.darkmatter = 1.5;
        starFieldPT.distfading = 0.75;
        let envOptions: any = {
            skyboxSize: 512,
            createGround: false,
            skyboxTexture: starFieldPT,
            environmentTexture: starFieldPT,
        };
        let light = new PointLight("starLight", Vector3.Zero(), scene);
        light.intensity = 2;
        light.diffuse = new Color3(0.98, 0.9, 1);
        light.specular = new Color3(1, 0.9, 0.5);
        let env = scene.createDefaultEnvironment(envOptions);
    }

    private static createStar(scene: Scene): Mesh {
        let starDiam = 16;
        let star = MeshBuilder.CreateSphere(
            "star",
            { diameter: starDiam, segments: 128 },
            scene
        );
        let mat = new StandardMaterial("starMat", scene);
        star.material = mat;
        mat.emissiveColor = new Color3(0.37, 0.333, 0.11);
        mat.diffuseTexture = new Texture(distortTexture, scene);
        mat.diffuseTexture.level = 5.8;

        return star;
    }

    private static populatePlanetarySystem(scene: Scene): Mesh[] {
        let planets: Mesh[] = [];
        let hg: PlanetOptions = {
            name: "hg",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 24,
            scale: 2,
            color: new Color3(0.45, 0.33, 0.18),
            rocky: true,
        };
        let aphro: PlanetOptions = {
            name: "aphro",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 35,
            scale: 3.5,
            color: new Color3(0.91, 0.89, 0.72),
            rocky: true,
        };
        let tellus: PlanetOptions = {
            name: "tellus",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 65,
            scale: 3.75,
            color: new Color3(0.17, 0.63, 0.05),
            rocky: true,
        };
        let ares: PlanetOptions = {
            name: "ares",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 100,
            scale: 3,
            color: new Color3(0.55, 0, 0),
            rocky: true,
        };
        let zeus: PlanetOptions = {
            name: "zeus",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 160,
            scale: 6,
            color: new Color3(1, 0.68, 0),
            rocky: false,
        };
        planets.push(AstroFactory.createPlanet(hg, scene));
        planets.push(AstroFactory.createPlanet(aphro, scene));
        planets.push(AstroFactory.createPlanet(tellus, scene));
        planets.push(AstroFactory.createPlanet(ares, scene));
        planets.push(AstroFactory.createPlanet(zeus, scene));

        return planets;
    }
}
