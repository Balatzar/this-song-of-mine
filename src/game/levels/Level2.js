import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { Snail } from "../objects/Snail";
import { ExitSign } from "../objects/ExitSign";
import { OneWayPlatform } from "../objects/OneWayPlatform";

/**
 * Level 2 - A simple new level with different layout
 */
export class Level2 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        // Different starting position for variety
        return { x: 150, y: null }; // y will be calculated by Player class
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Snare", "Hi-Hat", "Open Hat"],
            budgetConfig: {
                Kick: { max: 4, unlimited: false },
                Snare: { max: 2, unlimited: false },
                "Hi-Hat": { max: 0, unlimited: true },
                "Open Hat": { max: 1, unlimited: false },
            },
        };
    }

    getMeasureCount() {
        return 3;
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

        console.log("Level 2 created successfully");
    }
}

