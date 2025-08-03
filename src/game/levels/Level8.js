import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { ExitSign } from "../objects/ExitSign";
import { Drummy } from "../objects/Drummy";
import { Snail } from "../objects/Snail";

/**
 * Level 8 - Test level for blocked beats feature
 * Kick drum beats 1, 5, and 9 are blocked (0-indexed: 0, 4, 8)
 */
export class Level8 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        return { x: 400, y: 1600 };
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Snare", "Hi-Hat"],
            budgetConfig: {
                Kick: { max: 8, unlimited: false },
                Snare: { max: 4, unlimited: false },
                "Hi-Hat": { max: 0, unlimited: true },
            },
        };
    }

    getMeasureCount() {
        return 4;
    }

    getMaxLoops() {
        return 2;
    }

    getBlockedBeats() {
        return {
            Kick: [0, 1, 2, 3],
            Snare: [4, 6, 8, 12],
            "Hi-Hat": [5, 7, 9, 11, 12],
        };
    }

    getDebugPattern() {
        // Simple test pattern - Hi-Hat on every beat, avoiding blocked kicks
        return {
            "Hi-Hat": [
                true,
                true,
                true,
                true,
                true,
                false,
                true,
                false,
                true,
                false,
                true,
                false,
                false,
                true,
                true,
                true,
            ],
            Kick: [
                false,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                true,
                false,
                false,
                false,
                true,
                true,
                false,
                false,
            ],
            Snare: [
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
                false,
                false,
                false,
            ],
        };
    }

    create() {
        console.log("Creating Level 8 - Blocked Beats Test...");

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

        for (let x = 6; x < 9; x++) {
            this.createBlockAt(x, 5, "bricks_brown");
        }

        for (let x = 12; x < 17; x++) {
            this.createBlockAt(x, 4, "bricks_brown");
        }

        const drummy1 = new Drummy(
            this.scene,
            15,
            5,
            0,
            0,
            this.player,
            2 * 64
        );
        this.addEnemy(drummy1);

        this.createWall(18, 8, 18, 1, "bricks_brown");

        this.createBlockAt(19, 8, "bricks_brown");
        this.createBlockAt(19, 9, "bricks_brown");

        const drummy2 = new Drummy(
            this.scene,
            28,
            1,
            10,
            0,
            this.player,
            2 * 64
        );
        this.addEnemy(drummy2);

        const snail1 = new Snail(this.scene, 21, 1, 0, 0, this.player, 2 * 64);
        this.addEnemy(snail1);

        for (let x = 30; x < 35; x++) {
            this.createBlockAt(x, 3, "bricks_brown");
        }
        this.createBlockAt(34, 1, "bricks_brown");
        this.createBlockAt(34, 2, "bricks_brown");

        // Create exit sign
        const exitSign = new ExitSign(this.scene, 33, 1, 0, 0, this.player);
        this.addLevelObject(exitSign);
    }
}

