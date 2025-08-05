import { EventBus } from "../EventBus";

/**
 * Exit Sign game object
 * When the player touches this sign, they win the game
 */
export class ExitSign {
    /**
     * Create an exit sign
     * @param {Scene} scene - The Phaser scene
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
     * @param {number} offsetX - Pixel offset from block position (default: 0)
     * @param {number} offsetY - Pixel offset from block position (default: 0)
     * @param {Player} player - Player object for collision setup (optional)
     */
    constructor(
        scene,
        blockX,
        blockY,
        offsetX = 0,
        offsetY = 0,
        player = null
    ) {
        this.scene = scene;

        // Create the exit sign sprite at origin first
        this.sprite = scene.physics.add.sprite(0, 0, "sign_exit");

        // Make the collision box taller (width, height)
        this.sprite.body.setSize(
            this.sprite.width + 20,
            this.sprite.height * 2
        );

        // Make it static (doesn't fall or move)
        this.sprite.body.setImmovable(true);
        this.sprite.body.moves = false;

        // Position the exit sign using block coordinates
        this.setBlockPosition(blockX, blockY, offsetX, offsetY);

        // Set up collision detection with player if provided
        if (player) {
            this.setupCollisions(player);
        }
    }

    setupCollisions(player) {
        // Add overlap detection with player
        this.scene.physics.add.overlap(
            player.sprite,
            this.sprite,
            () => this.onPlayerTouch(),
            null,
            this.scene
        );
    }

    onPlayerTouch() {
        // Check if game is over (time limit reached)
        if (this.scene.isGameOver) {
            console.log(
                "Player touched exit but game is over - no win allowed"
            );
            return;
        }

        // Trigger win condition
        this.showWinMessage();
    }

    showWinMessage() {
        // Create win text
        const winText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            "YOU WIN!",
            {
                fontSize: "64px",
                fontFamily: "Arial",
                color: "#00ff00",
                stroke: "#000000",
                strokeThickness: 4,
            }
        );

        // Center the text
        winText.setOrigin(0.5);

        // Make sure it's always visible (fixed to camera)
        winText.setScrollFactor(0);

        // Add scaling animation for 2 seconds
        this.scene.tweens.add({
            targets: winText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 1,
            ease: "Sine.easeInOut",
        });

        // Remove the text after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            if (winText && winText.active) {
                winText.destroy();
            }
        });

        // Emit player won event (Game scene will handle the rest)
        EventBus.emit("player-won");

        console.log("Player reached the exit! You win!");
    }

    /**
     * Position the exit sign using block coordinates (bottom-up system)
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
     * @param {number} offsetX - Pixel offset from block position (default: 0)
     * @param {number} offsetY - Pixel offset from block position (default: 0)
     */
    setBlockPosition(blockX, blockY, offsetX = 0, offsetY = 0) {
        const blockSize = this.scene.blockSize;
        const worldHeight = this.scene.physics.world.bounds.height;

        // Convert block coordinates to pixel coordinates
        const pixelX = blockX * blockSize + blockSize / 2 + offsetX;
        const pixelY =
            worldHeight - (blockY + 1) * blockSize + blockSize / 2 + offsetY;

        this.sprite.setPosition(pixelX, pixelY);
    }

    /**
     * Get the sprite for external collision setup if needed
     */
    getSprite() {
        return this.sprite;
    }

    /**
     * Destroy the exit sign
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

