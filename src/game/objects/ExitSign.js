/**
 * Exit Sign game object
 * When the player touches this sign, they win the game
 */
export class ExitSign {
    constructor(scene, x, y, player) {
        this.scene = scene;

        // Create the exit sign sprite
        this.sprite = scene.physics.add.sprite(x, y, "sign_exit");

        // Make it static (doesn't fall or move)
        this.sprite.body.setImmovable(true);
        this.sprite.body.moves = false;

        // Set up collision detection with player
        this.setupCollisions(player);
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

        // Optional: Add some visual effects
        this.scene.tweens.add({
            targets: winText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        console.log("Player reached the exit! You win!");
    }

    /**
     * Position the exit sign using block coordinates (bottom-up system)
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
     */
    setBlockPosition(blockX, blockY) {
        const blockSize = this.scene.blockSize;
        const worldHeight = this.scene.physics.world.bounds.height;

        // Convert block coordinates to pixel coordinates
        const pixelX = blockX * blockSize + blockSize / 2;
        const pixelY = worldHeight - (blockY + 1) * blockSize + blockSize / 2;

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

