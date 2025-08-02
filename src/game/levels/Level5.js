import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { Snail } from "../objects/Snail";
import { ExitSign } from "../objects/ExitSign";
import { OneWayPlatform } from "../objects/OneWayPlatform";
import { Bridge } from "../objects/Bridge";

export class Level5 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        // Original starting position from Game.js
        return { x: 200, y: null }; // y will be calculated by Player class
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Snare", "Hi-Hat"],
            budgetConfig: {
                Kick: { max: 4, unlimited: false },
                Snare: { max: 2, unlimited: false },
                "Hi-Hat": { max: 0, unlimited: true },
                "Open Hat": { max: 0, unlimited: false },
            },
        };
    }

    getMeasureCount() {
        return 4; // Level 1 uses 4 measures
    }

    getMaxLoops() {
        return 2; // Level 1 uses 2 loops
    }

    create() {
        console.log("Creating Level 1...");

        // Create extended floor - cover much more ground for the larger world
        const worldWidth = this.scene.physics.world.bounds.width;
        const blocksPerRow = Math.ceil(worldWidth / this.scene.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player at the starting position
        const startPos = this.getPlayerStartPosition();
        this.player = new Player(this.scene, this.scene.platforms, startPos.x);

        // Create snail enemies
        const snail1 = new Snail(this.scene, 15, 1, 0, 0, this.player, 4 * 64);
        const snail2 = new Snail(this.scene, 25, 1, 0, 0, this.player, 4 * 64);
        this.addEnemy(snail1);
        this.addEnemy(snail2);

        // Create exit sign
        const exitSign = new ExitSign(this.scene, 30, 1, 0, 0, this.player);
        this.addLevelObject(exitSign);

        // Create level-specific blocks and platforms
        this.createBlockAt(6, 2, "bricks_brown", -30, -20);
        this.createBlockAt(11, 1, "bricks_brown", -20, -20);
        this.createBlockAt(11, 2, "bricks_brown", -20, -20);
        this.createBlockAt(12, 2, "bricks_brown", -20, -20);
        this.createBlockAt(12, 3, "bricks_brown", -20, -20);

        // Create one-way platform
        const oneWayPlatform = new OneWayPlatform(
            this.scene,
            7,
            2,
            -20,
            10,
            this.player
        );
        this.addLevelObject(oneWayPlatform);

        // Create bridge segments
        const bridge1 = new Bridge(this.scene, 8, 2, -0, 3, this.player);
        const bridge2 = new Bridge(this.scene, 9, 2, -20, 3, this.player);
        const bridge3 = new Bridge(this.scene, 10, 2, -20, 3, this.player);
        this.addLevelObject(bridge1);
        this.addLevelObject(bridge2);
        this.addLevelObject(bridge3);

        console.log("Level 1 created successfully");
    }
}

