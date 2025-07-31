import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class Game extends Scene {
    constructor() {
        super("Game");
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
        const blockSize = 32;
        const floorY = gameHeight - 32;
        for (let x = 0; x < gameWidth; x += blockSize) {
            this.platforms.create(x + blockSize / 2, floorY, "dirt_block");
        }

        // Create player (relative to game size)
        this.player = this.physics.add.sprite(
            gameWidth * 0.1,
            gameHeight * 0.7,
            "character_idle"
        );
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

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
        // Player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play("walk", true);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play("walk", true);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play("idle", true);
        }

        // Jumping
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
            this.player.anims.play("jump", true);
        }
    }
}

