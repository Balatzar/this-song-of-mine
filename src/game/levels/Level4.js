import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { ExitSign } from "../objects/ExitSign";
import { Snail } from "../objects/Snail";

export class Level4 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        return { x: 200, y: null }; // y will be calculated by Player class
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Hi-Hat"],
            budgetConfig: {
                Kick: { max: 2, unlimited: false },
                "Hi-Hat": { max: 0, unlimited: true },
            },
        };
    }

    getMeasureCount() {
        return 2;
    }

    getMaxLoops() {
        return 2;
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
        this.player = new Player(this.scene, this.scene.platforms, startPos.x);

        this.createBlockAt(6, 1, "bricks_brown", 0, 0);

        const snail1 = new Snail(this.scene, 15, 1, 0, 0, this.player, 4 * 64);
        this.addEnemy(snail1);

        const snail2 = new Snail(this.scene, 12, 1, 0, 0, this.player, 4 * 64);
        this.addEnemy(snail2);

        const exitSign = new ExitSign(this.scene, 16, 1, 0, 0, this.player);
        this.addLevelObject(exitSign);
    }
}

