/**
 * One Way Platform game object
 * A platform that can be passed through from below but is solid when standing on it
 */
export class OneWayPlatform {
    /**
     * Create a one-way platform
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

        // Create the platform sprite at origin first
        this.sprite = scene.physics.add.sprite(0, 0, "bridge_logs");

        // Make it static (doesn't fall or move)
        this.sprite.body.setImmovable(true);
        this.sprite.body.moves = false;

        // Position the platform using block coordinates
        this.setBlockPosition(blockX, blockY, offsetX, offsetY);

        // Set up collisions if player is provided
        if (player) {
            this.setupCollisions(player);
        }
    }

    setupCollisions(player) {
        // Use collider with custom process callback for one-way logic
        this.scene.physics.add.collider(
            player.sprite, // Use the player sprite directly
            this.sprite,
            null, // No collision callback needed
            (playerSprite, platform) =>
                this.shouldCollide(playerSprite, platform), // Process callback
            this.scene
        );
    }

    shouldCollide(player, platform) {
        // Only allow collision if player is coming from above
        const platformTop = platform.body.top;
        const playerPreviousBottom = player.body.prev.y + player.body.height;

        // Check if player was above the platform in the previous frame
        // and is falling down (or moving very slowly)
        const wasAbove = playerPreviousBottom <= platformTop + 5;
        const isFallingOrStable = player.body.velocity.y >= -50; // Allow small upward velocity for stability

        // Only collide if player was above and is not jumping up fast
        return wasAbove && isFallingOrStable;
    }

    /**
     * Position the platform using block coordinates (bottom-up system)
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
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
     * Destroy the platform
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

