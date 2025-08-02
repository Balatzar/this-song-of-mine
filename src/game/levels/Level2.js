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

        // Create a single snail enemy in a different position
        const snail = new Snail(this.scene, 20, 1, 0, 0, this.player, 6 * 64);
        this.addEnemy(snail);

        // Create exit sign closer to the start for this simple level
        const exitSign = new ExitSign(this.scene, 25, 1, 0, 0, this.player);
        this.addLevelObject(exitSign);

        // Create a simple staircase pattern
        this.createBlockAt(5, 1, "bricks_brown");
        this.createBlockAt(6, 2, "bricks_brown");
        this.createBlockAt(7, 3, "bricks_brown");
        this.createBlockAt(8, 4, "bricks_brown");

        // Create a descending staircase
        this.createBlockAt(9, 3, "bricks_brown");
        this.createBlockAt(10, 2, "bricks_brown");
        this.createBlockAt(11, 1, "bricks_brown");

        // Add some floating platforms
        this.createBlockAt(13, 3, "bricks_brown");
        this.createBlockAt(15, 2, "bricks_brown");
        this.createBlockAt(17, 4, "bricks_brown");

        // Create a one-way platform for variety
        const oneWayPlatform = new OneWayPlatform(
            this.scene,
            14,
            2,
            0,
            0,
            this.player
        );
        this.addLevelObject(oneWayPlatform);

        console.log("Level 2 created successfully");
    }
}

