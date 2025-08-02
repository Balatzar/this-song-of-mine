import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { ExitSign } from "../objects/ExitSign";
import { Drummy } from "../objects/Drummy";

export class Level6 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        return { x: 200, y: null }; // y will be calculated by Player class
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Snare", "Hi-Hat"],
            budgetConfig: {
                Kick: { max: 2, unlimited: false },
                Snare: { max: 1, unlimited: false },
                "Hi-Hat": { max: 0, unlimited: true },
            },
        };
    }

    getMeasureCount() {
        return 2;
    }

    getMaxLoops() {
        return 4;
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

        this.createBlockAt(13, 4, "bricks_brown", 0, 0);
        this.createBlockAt(14, 4, "bricks_brown", 0, 0);
        this.createBlockAt(15, 4, "bricks_brown", 0, 0);
        this.createBlockAt(16, 4, "bricks_brown", 0, 0);
        this.createBlockAt(17, 4, "bricks_brown", 0, 0);
        this.createBlockAt(18, 4, "bricks_brown", 0, 0);
        this.createBlockAt(19, 4, "bricks_brown", 0, 0);
        this.createBlockAt(20, 4, "bricks_brown", 0, 0);

        const drummy2 = new Drummy(
            this.scene,
            19,
            5,
            0,
            0,
            this.player,
            2 * 64
        );
        this.addEnemy(drummy2);

        this.createBlockAt(21, 8, "bricks_brown", 0, 0);
        this.createBlockAt(22, 8, "bricks_brown", 0, 0);
        this.createBlockAt(23, 8, "bricks_brown", 0, 0);
        this.createBlockAt(24, 8, "bricks_brown", 0, 0);
        this.createBlockAt(25, 8, "bricks_brown", 0, 0);
        this.createBlockAt(26, 8, "bricks_brown", 0, 0);
        this.createBlockAt(27, 8, "bricks_brown", 0, 0);
        this.createBlockAt(28, 8, "bricks_brown", 0, 0);
        this.createBlockAt(29, 8, "bricks_brown", 0, 0);

        // Create exit sign far enough to require using the drummies as trampolines
        const exitSign = new ExitSign(this.scene, 29, 9, 0, 0, this.player);
        this.addLevelObject(exitSign);
    }
}

