import { EventBus } from "../EventBus";

/**
 * Snail Enemy game object
 * A simple enemy that moves left and right slowly in a patrol zone
 * Kills player on side contact, dies when player jumps on it
 */
export class Snail {
    /**
     * Create a snail enemy
     * @param {Scene} scene - The Phaser scene
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
     * @param {number} offsetX - Pixel offset from block position (default: 0)
     * @param {number} offsetY - Pixel offset from block position (default: 0)
     * @param {Player} player - Player object for collision setup
     * @param {number} patrolWidth - Width of patrol zone in pixels (default: 3 blocks)
     */
    constructor(
        scene,
        blockX,
        blockY,
        offsetX = 0,
        offsetY = 0,
        player = null,
        patrolWidth = 3 * 64 // 3 blocks by default
    ) {
        this.scene = scene;
        this.player = player;
        this.patrolWidth = patrolWidth;

        // Store constructor parameters for respawning
        this.spawnParams = {
            blockX,
            blockY,
            offsetX,
            offsetY,
        };

        // Movement state
        this.speed = 30; // Very slow movement
        this.direction = -1; // 1 for right, -1 for left
        this.startX = null; // Will be set after positioning

        // Create the snail sprite
        this.sprite = scene.physics.add.sprite(0, 0, "snail_walk_a");

        // Set up physics
        this.setupPhysics();

        // Position the snail using block coordinates
        this.setBlockPosition(blockX, blockY, offsetX, offsetY);

        // Store the starting position for patrol bounds
        this.startX = this.sprite.x;

        // Store initial position and state for reset functionality
        this.initialPosition = {
            x: this.sprite.x,
            y: this.sprite.y,
            flipX: this.sprite.flipX || false,
            direction: this.direction,
            startX: this.startX,
        };

        // Set up collisions if player is provided
        if (player) {
            this.setupCollisions(player);
        }

        // Set up platform collisions
        this.setupPlatformCollisions();
    }

    setupPhysics() {
        // Enable physics and set properties
        this.sprite.setBounce(0);
        this.sprite.setCollideWorldBounds(true);

        // Set up physics body
        this.sprite.body.setGravityY(600); // Same gravity as other objects
        this.sprite.body.setSize(48, 32, true); // Adjust collision box for snail size
        this.sprite.body.setOffset(8, 16); // Center the collision box
    }

    setupPlatformCollisions() {
        // Collide with platforms so snail doesn't fall through floor
        this.scene.physics.add.collider(this.sprite, this.scene.platforms);
    }

    setupCollisions(player) {
        // Set up collision with player
        this.scene.physics.add.overlap(
            player.getSprite(),
            this.sprite,
            (playerSprite, snailSprite) =>
                this.handlePlayerCollision(playerSprite, snailSprite),
            null,
            this.scene
        );
    }

    handlePlayerCollision(playerSprite, snailSprite) {
        // Get collision details
        const playerBody = playerSprite.body;
        const snailBody = snailSprite.body;

        // Check if player is jumping on the snail (from above)
        const playerBottom = playerBody.bottom;
        const snailTop = snailBody.top;
        const isJumpingOn =
            playerBody.velocity.y > 0 && playerBottom <= snailTop + 10;

        if (isJumpingOn) {
            // Player jumped on snail - snail dies, player bounces
            this.die();
            playerSprite.setVelocityY(-400); // Bounce the player up
        } else {
            // Side collision - player dies (reset level)
            this.killPlayer();
        }
    }

    die() {
        // Snail dies - destroy the sprite
        if (this.sprite) {
            // Optional: Add death animation or effect here
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    killPlayer() {
        // Emit player death event instead of directly restarting
        EventBus.emit("player-died");
    }

    /**
     * Position the snail using block coordinates (bottom-up system)
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
     * Update snail movement and patrol logic
     */
    update() {
        if (!this.sprite || !this.sprite.body) return;

        // Check patrol bounds
        const leftBound = this.startX - this.patrolWidth / 2;
        const rightBound = this.startX + this.patrolWidth / 2;

        // Check if snail hit patrol bounds
        if (this.sprite.x <= leftBound && this.direction === -1) {
            this.direction = 1; // Turn right
            this.sprite.setFlipX(true);
        } else if (this.sprite.x >= rightBound && this.direction === 1) {
            this.direction = -1; // Turn left
            this.sprite.setFlipX(false);
        }

        // Check if snail hit a wall (for when it encounters blocks)
        if (this.sprite.body.blocked.left && this.direction === -1) {
            this.direction = 1; // Turn right
            this.sprite.setFlipX(true);
        } else if (this.sprite.body.blocked.right && this.direction === 1) {
            this.direction = -1; // Turn left
            this.sprite.setFlipX(false);
        }

        // Apply movement
        this.sprite.setVelocityX(this.speed * this.direction);
    }

    /**
     * Get the sprite for external access
     */
    getSprite() {
        return this.sprite;
    }

    /**
     * Respawn the snail if it has been destroyed
     */
    respawn() {
        if (this.sprite) return; // Already exists, no need to respawn

        // Recreate the sprite
        this.sprite = this.scene.physics.add.sprite(0, 0, "snail_walk_a");

        // Set up physics again
        this.setupPhysics();

        // Position the snail using stored spawn parameters
        this.setBlockPosition(
            this.spawnParams.blockX,
            this.spawnParams.blockY,
            this.spawnParams.offsetX,
            this.spawnParams.offsetY
        );

        // Set up collisions again
        if (this.player) {
            this.setupCollisions(this.player);
        }
        this.setupPlatformCollisions();

        console.log("Snail respawned");
    }

    /**
     * Reset snail to initial position and state
     */
    resetToInitialState() {
        if (!this.initialPosition) return;

        // Respawn if the snail was destroyed
        this.respawn();

        // Reset position using stored initial values
        this.sprite.setPosition(this.initialPosition.x, this.initialPosition.y);
        this.sprite.setVelocity(0, 0);
        this.sprite.setFlipX(this.initialPosition.flipX);

        // Reset snail state
        this.direction = this.initialPosition.direction;
        this.startX = this.initialPosition.startX;
    }

    /**
     * Destroy the snail and clean up
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

