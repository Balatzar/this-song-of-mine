import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { DebugTools } from "../debug";

export class Game extends Scene {
    constructor() {
        super("Game");
        this.blockSize = 64;
        this.blockOffset = 32;
    }

    /**
     * Helper function to create a block at block coordinates
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
     * @param {string} texture - The texture key for the block
     * @returns {Phaser.Physics.Arcade.Sprite} The created block sprite
     */
    createBlockAt(blockX, blockY, texture) {
        // Use world height instead of viewport height since we expanded the world
        const worldHeight = this.physics.world.bounds.height;

        // Convert block coordinates to pixel coordinates
        // Blocks are positioned by their center
        const pixelX = blockX * this.blockSize + this.blockSize / 2;
        const pixelY =
            worldHeight - (blockY + 1) * this.blockSize + this.blockSize / 2;

        return this.platforms.create(pixelX, pixelY, texture);
    }

    create() {
        // Get dynamic game dimensions
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Set up much larger world bounds - 5x larger than viewport
        const worldWidth = gameWidth * 5;
        const worldHeight = gameHeight * 5;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Create platforms group
        this.platforms = this.physics.add.staticGroup();

        // Create platforms and terrain across the larger world
        this.createBlockAt(3, 3, "dirt_block");
        this.createBlockAt(6, 1, "dirt_block");
        this.createBlockAt(8, 3, "dirt_block");

        // Add more platforms across the expanded world
        this.createBlockAt(15, 5, "dirt_block");
        this.createBlockAt(16, 5, "dirt_block");
        this.createBlockAt(17, 5, "dirt_block");

        this.createBlockAt(25, 3, "dirt_block");
        this.createBlockAt(26, 3, "dirt_block");

        this.createBlockAt(35, 7, "dirt_block");
        this.createBlockAt(36, 7, "dirt_block");
        this.createBlockAt(37, 7, "dirt_block");
        this.createBlockAt(38, 7, "dirt_block");

        this.createBlockAt(50, 4, "dirt_block");
        this.createBlockAt(51, 4, "dirt_block");
        this.createBlockAt(52, 5, "dirt_block");
        this.createBlockAt(53, 6, "dirt_block");

        // Create extended floor - cover much more ground for the larger world
        const blocksPerRow = Math.ceil(worldWidth / this.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player - position within the larger world, from the bottom
        this.player = this.physics.add.sprite(
            200, // Start a bit into the world horizontally
            worldHeight - 200, // Position from the bottom of the larger world
            "character_idle"
        );
        // Remove bounce for snappier movement
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);

        // Set up camera to follow the player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(0.05, 0.05); // Smooth camera following
        this.cameras.main.setZoom(1); // Adjust zoom if needed
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        this.player.body.setSize(64, 80, true);
        this.player.body.setOffset(32, 44);

        // Make player more responsive with higher gravity and air resistance
        // Adjusted for 64px blocks (doubled from previous 32px blocks)
        this.player.body.setGravityY(1200); // Faster falling (scaled for larger blocks)
        this.player.setDragX(1500); // Quick stopping when not moving

        // Player physics
        this.physics.add.collider(this.player, this.platforms);

        // Create walking animation
        this.anims.create({
            key: "walk",
            frames: [{ key: "character_walk_a" }, { key: "character_walk_b" }],
            frameRate: 10,
            repeat: -1,
        });

        // Create jump animation
        this.anims.create({
            key: "jump",
            frames: [{ key: "character_jump" }],
            frameRate: 20,
        });

        // Create idle animation
        this.anims.create({
            key: "idle",
            frames: [{ key: "character_idle" }],
            frameRate: 20,
        });

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Add grid overlay
        DebugTools.createGridOverlay(this, this.blockSize);

        // Add collision zone visualization (you can toggle this on/off)
        this.showCollisions = true; // Set to false to disable

        // Add debug info for player body
        DebugTools.createBodyDebugInfo(this, this.player.body, "Player");

        // Add keyboard controls for toggling debug features
        this.debugKeys = this.input.keyboard.addKeys("C,G");

        EventBus.emit("current-scene-ready", this);
    }

    update() {
        // Debug controls
        if (Phaser.Input.Keyboard.JustDown(this.debugKeys.C)) {
            DebugTools.toggleCollisionZones(this);
        }

        // Update collision visualization if enabled
        if (this.showCollisions) {
            DebugTools.showCollisionZones(this, {
                lineColor: 0xff0000, // Red outline
                fillColor: 0xff0000, // Red fill
                fillAlpha: 0.2, // Semi-transparent
                lineAlpha: 0.8, // More opaque outline
                lineWidth: 2,
            });
        }

        // Player movement - adjusted for 64px blocks
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-320);
            this.player.anims.play("walk", true);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(320);
            this.player.anims.play("walk", true);
            this.player.setFlipX(false);
        } else {
            // Let drag handle stopping for more responsive feel
            this.player.anims.play("idle", true);
        }

        // Jumping - adjusted for 64px blocks
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-700);
            this.player.anims.play("jump", true);
        }
    }
}

