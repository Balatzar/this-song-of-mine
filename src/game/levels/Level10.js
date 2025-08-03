import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { ExitSign } from "../objects/ExitSign";
import { Drummy } from "../objects/Drummy";
import { Bridge } from "../objects/Bridge";
import { Snail } from "../objects/Snail";
import { Saw } from "../objects/Saw";
import { OneWayPlatform } from "../objects/OneWayPlatform";

export class Level10 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        return { x: 300, y: null };
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Hi-Hat", "Clap", "Crash"],
            budgetConfig: {
                Kick: { max: 8, unlimited: false },
                "Hi-Hat": { max: 20, unlimited: false },
                Clap: { max: 12, unlimited: false },
                Crash: { max: 4, unlimited: false },
            },
        };
    }

    getMeasureCount() {
        return 4;
    }

    getMaxLoops() {
        return 4;
    }

    getBlockedBeats() {
        return {
            Kick: [0, 8, 16],
            "Hi-Hat": [1, 5, 9, 13],
            Clap: [3, 7, 11],
            Crash: [0, 12],
        };
    }

    getForcedBeats() {
        return {
            "Hi-Hat": [4],
            Kick: [10],
            Crash: [],
            Clap: [6],
        };
    }

    getDebugPattern() {
        return {
            Kick: [
                false,
                true,
                false,
                false,
                true,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
            ],
            "Hi-Hat": [
                true,
                false,
                true,
                true,
                true,
                false,
                false,
                true,
                true,
                false,
                true,
                true,
                true,
                false,
                true,
                true,
            ],
            Clap: [
                false,
                false,
                true,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                true,
                false,
            ],
            Crash: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
                false,
            ],
        };
    }

    create() {
        // Create extended floor
        const worldWidth = this.scene.physics.world.bounds.width;
        const blocksPerRow = Math.ceil(worldWidth / this.scene.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player at the starting position
        const startPos = this.getPlayerStartPosition();
        this.player = new Player(
            this.scene,
            this.scene.platforms,
            startPos.x,
            startPos.y
        );

        const snail1 = new Snail(this.scene, 8, 1, 0, 0, this.player, 3 * 64);
        this.addEnemy(snail1);

        const drummy1 = new Drummy(
            this.scene,
            10,
            1,
            0,
            0,
            this.player,
            2 * 64
        );
        this.addEnemy(drummy1);

        const oneWayPlatform1 = new OneWayPlatform(
            this.scene,
            10,
            4,
            0,
            0,
            this.player
        );
        this.addLevelObject(oneWayPlatform1);

        const oneWayPlatform2 = new OneWayPlatform(
            this.scene,
            11,
            4,
            0,
            0,
            this.player
        );
        this.addLevelObject(oneWayPlatform2);

        const oneWayPlatform3 = new OneWayPlatform(
            this.scene,
            12,
            4,
            0,
            0,
            this.player
        );
        this.addLevelObject(oneWayPlatform3);

        const oneWayPlatform4 = new OneWayPlatform(
            this.scene,
            13,
            5,
            0,
            0,
            this.player
        );
        this.addLevelObject(oneWayPlatform4);

        this.createWall(14, 5, 16, 5, "bricks_brown");

        const saw1 = new Saw(this.scene, 14, 8, 0, 0, this.player, 6 * 64);
        this.addEnemy(saw1);

        const bridge1 = new Bridge(this.scene, 17, 3, 0, 10, this.player);
        this.addLevelObject(bridge1);

        const bridge2 = new Bridge(this.scene, 18, 3, 0, 10, this.player);
        this.addLevelObject(bridge2);

        const bridge3 = new Bridge(this.scene, 19, 3, 0, 10, this.player);
        this.addLevelObject(bridge3);

        const bridge4 = new Bridge(this.scene, 20, 3, 0, 10, this.player);
        this.addLevelObject(bridge4);

        const bridge5 = new Bridge(this.scene, 21, 3, 0, 10, this.player);
        this.addLevelObject(bridge5);

        const saw2 = new Saw(this.scene, 16, 8, 0, 0, this.player, 6 * 64);
        this.addEnemy(saw2);

        const saw3 = new Saw(this.scene, 20, 6, 0, 0, this.player, 6 * 64);
        this.addEnemy(saw3);

        const drummy2 = new Drummy(
            this.scene,
            24,
            1,
            -10,
            0,
            this.player,
            2 * 64
        );
        this.addEnemy(drummy2);

        this.createWall(24, 4, 30, 4, "bricks_brown");

        const exitSign = new ExitSign(this.scene, 29, 5, 0, 0, this.player);
        this.addLevelObject(exitSign);
    }
}

