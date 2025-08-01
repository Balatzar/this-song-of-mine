/**
 * Bridge game object
 * A bridge block with collision only in the upper half of the sprite
 */
export class Bridge {
    /**
     * Create a bridge block
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

        // Create the bridge sprite at origin first
        this.sprite = scene.physics.add.sprite(0, 0, "bridge");

        // Make it static (doesn't fall or move)
        this.sprite.body.setImmovable(true);
        this.sprite.body.moves = false;

        // Set custom collision box - upper half only
        // The sprite is 64x64, so collision should be 64x32 in the upper half
        const spriteWidth = 64;
        const spriteHeight = 64;
        const collisionHeight = spriteHeight / 2; // Upper half only

        // Set the collision box size and offset
        // Offset Y by -16 to move the collision box to the upper half
        this.sprite.body.setSize(spriteWidth, collisionHeight, false);
        this.sprite.body.setOffset(0, 0); // Top part of the sprite

        // Position the bridge using block coordinates
        this.setBlockPosition(blockX, blockY, offsetX, offsetY);

        // Add to platforms group for collision with player
        if (scene.platforms) {
            scene.platforms.add(this.sprite);
        }

        // Set up collisions if player is provided
        if (player) {
            this.setupCollisions(player);
        }
    }

    setupCollisions(player) {
        // Bridge acts like a normal platform - no special collision logic needed
        // The reduced collision box handles the "pass through bottom" behavior
        this.scene.physics.add.collider(
            player.sprite, // Use the player sprite directly
            this.sprite
        );
    }

    /**
     * Position the bridge using block coordinates (bottom-up system)
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
     * Destroy the bridge
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

