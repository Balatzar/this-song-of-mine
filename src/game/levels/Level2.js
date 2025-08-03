import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { ExitSign } from "../objects/ExitSign";

/**
 * Level 2 - A simple new level with different layout
 */
export class Level2 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        return { x: 800, y: null }; // y will be calculated by Player class
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Hi-Hat"],
            budgetConfig: {
                Kick: { max: 0, unlimited: true },
                "Hi-Hat": { max: 0, unlimited: true },
            },
        };
    }

    getMeasureCount() {
        return 2;
    }

    getMaxLoops() {
        return 1; // Level 2 uses only 1 loop for quick completion
    }

    getDebugPattern() {
        return {
            "Hi-Hat": [true, true, true, true, true, true, true, true],
            Kick: [false, false, false, true, false, false, false, false],
        };
    }

    create() {
        console.log("Creating Level 2...");

        // Create extended floor
        const worldWidth = this.scene.physics.world.bounds.width;
        const blocksPerRow = Math.ceil(worldWidth / this.scene.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player at the starting position
        const startPos = this.getPlayerStartPosition();
        this.player = new Player(this.scene, this.scene.platforms, startPos.x);

        this.createBlockAt(17, 1, "bricks_brown", 0, 0);

        // Create exit sign
        const exitSign = new ExitSign(this.scene, 20, 1, 0, 0, this.player);
        this.addLevelObject(exitSign);

        console.log("Level 2 created successfully");
    }
}

