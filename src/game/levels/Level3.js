import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { ExitSign } from "../objects/ExitSign";

/**
 * Level 3 - A very simple level with player and exit sign next to each other
 */
export class Level3 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        // Simple starting position close to the left
        return { x: 100, y: null }; // y will be calculated by Player class
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Snare", "Hi-Hat", "Open Hat"],
            budgetConfig: {
                Kick: { max: 6, unlimited: false },
                Snare: { max: 4, unlimited: false },
                "Hi-Hat": { max: 0, unlimited: true },
                "Open Hat": { max: 0, unlimited: true },
            },
        };
    }

    getMeasureCount() {
        return 4;
    }

    create() {
        console.log("Creating Level 3...");

        // Create extended floor
        const worldWidth = this.scene.physics.world.bounds.width;
        const blocksPerRow = Math.ceil(worldWidth / this.scene.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player at the starting position
        const startPos = this.getPlayerStartPosition();
        this.player = new Player(this.scene, this.scene.platforms, startPos.x);

        // Create exit sign very close to the player - just a few blocks to the right
        const exitSign = new ExitSign(this.scene, 3, 1, 0, 0, this.player);
        this.addLevelObject(exitSign);

        console.log(
            "Level 3 created successfully - simple level with exit nearby"
        );
    }
}

