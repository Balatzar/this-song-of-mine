import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class Game extends Scene {
    constructor() {
        super("Game");
        this.blockSize = 64; // Store as class property for reuse
    }

    create() {
        // Get dynamic game dimensions
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Set up world bounds
        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

        // Create platforms group
        this.platforms = this.physics.add.staticGroup();

        // Create floor - a complete solid ground
        // Position floor so bottom edge touches game bottom (account for center positioning)
        const floorY = gameHeight - this.blockSize / 2;
        for (let x = 0; x < gameWidth; x += this.blockSize) {
            this.platforms.create(x + this.blockSize / 2, floorY, "dirt_block");
        }

        // Create player (relative to game size)
        this.player = this.physics.add.sprite(
            gameWidth * 0.1,
            gameHeight * 0.7,
            "character_idle"
        );
        // Remove bounce for snappier movement
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);

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

        EventBus.emit("current-scene-ready", this);
    }

    update() {
        // Player movement - adjusted for 64px blocks
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-320); // Scaled up for larger blocks
            this.player.anims.play("walk", true);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(320); // Scaled up for larger blocks
            this.player.anims.play("walk", true);
            this.player.setFlipX(false);
        } else {
            // Let drag handle stopping for more responsive feel
            this.player.anims.play("idle", true);
        }

        // Jumping - adjusted for 64px blocks
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-600); // Scaled up for larger blocks
            this.player.anims.play("jump", true);
        }
    }
}

