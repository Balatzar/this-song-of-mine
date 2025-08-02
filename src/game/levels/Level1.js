import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { ExitSign } from "../objects/ExitSign";

/**
 * Level 1 - The original level layout
 */
export class Level1 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        // Original starting position from Game.js
        return { x: 200, y: null }; // y will be calculated by Player class
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Hi-Hat"],
            budgetConfig: {
                "Hi-Hat": { max: 0, unlimited: true },
            },
        };
    }

    getMeasureCount() {
        return 1;
    }

    getMaxLoops() {
        return 1;
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

        // Create exit sign
        const exitSign = new ExitSign(this.scene, 6, 1, 10, 0, this.player);
        this.addLevelObject(exitSign);

        console.log("Level 1 created successfully");
    }
}

