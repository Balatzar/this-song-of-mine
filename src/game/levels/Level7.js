import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { ExitSign } from "../objects/ExitSign";
import { Saw } from "../objects/Saw";
import { Bridge } from "../objects/Bridge";

/**
 * Level 7 - Saw Challenge Level
 * Focus on the new crash instrument and saw enemy mechanics
 */
export class Level7 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        return { x: 200, y: null }; // y will be calculated by Player class
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Hi-Hat", "Crash"],
            budgetConfig: {
                Kick: { max: 6, unlimited: false },
                "Hi-Hat": { max: 0, unlimited: true },
                Crash: { max: 2, unlimited: false },
            },
        };
    }

    getMeasureCount() {
        return 3;
    }

    getMaxLoops() {
        return 4;
    }

    getDebugPattern() {
        // Pattern showcasing the new Crash instrument for Level 7 (3 measures = 12 steps)
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
            ],
            "Hi-Hat": [
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
            ],
            Crash: [
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
                false,
                false,
            ],
        };
    }

    create() {
        console.log("Creating Level 7 - Saw Challenge...");

        // Create extended floor
        const worldWidth = this.scene.physics.world.bounds.width;
        const blocksPerRow = Math.ceil(worldWidth / this.scene.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player at the starting position
        const startPos = this.getPlayerStartPosition();
        this.player = new Player(this.scene, this.scene.platforms, startPos.x);

        // Create a simple platform structure for the challenge
        // First platform - safe area
        this.createBlockAt(5, 1, "bricks_brown");
        this.createBlockAt(6, 1, "bricks_brown");
        this.createBlockAt(7, 1, "bricks_brown");

        const saw1 = new Saw(this.scene, 9, 5, 0, 0, this.player, 4 * 64);
        this.addEnemy(saw1);

        this.createBlockAt(10, 1, "bricks_brown");
        this.createBlockAt(10, 2, "bricks_brown");
        this.createBlockAt(11, 1, "bricks_brown");
        this.createBlockAt(11, 2, "bricks_brown");
        this.createBlockAt(12, 1, "bricks_brown");
        this.createBlockAt(12, 2, "bricks_brown");

        this.createWall(14, 3, 14, 8, "bricks_brown");

        const bridge1 = new Bridge(this.scene, 14, 2, 0, 0, this.player);
        this.addLevelObject(bridge1);
        const bridge2 = new Bridge(this.scene, 15, 2, 0, 0, this.player);
        this.addLevelObject(bridge2);
        const bridge3 = new Bridge(this.scene, 16, 2, 0, 0, this.player);
        this.addLevelObject(bridge3);
        const bridge4 = new Bridge(this.scene, 17, 2, 0, 0, this.player);
        this.addLevelObject(bridge4);

        const saw2 = new Saw(this.scene, 18, 5, 0, 0, this.player, 4 * 64);
        this.addEnemy(saw2);

        // Create exit sign on the final platform
        const exitSign = new ExitSign(this.scene, 25, 4, 0, 10, this.player);
        this.addLevelObject(exitSign);

        console.log("Level 7 - Saw Challenge created successfully");
    }
}

