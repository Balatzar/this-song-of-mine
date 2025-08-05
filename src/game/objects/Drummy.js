import { EventBus } from "../EventBus";

/**
 * Drummy Enemy game object
 * Similar to snail but goes further and launches player very high when hit from top
 * Kills player on side contact, launches player high when jumped on
 */
export class Drummy {
    /**
     * Create a drummy enemy
     * @param {Scene} scene - The Phaser scene
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
     * @param {number} offsetX - Pixel offset from block position (default: 0)
     * @param {number} offsetY - Pixel offset from block position (default: 0)
     * @param {Player} player - Player object for collision setup
     * @param {number} patrolWidth - Width of patrol zone in pixels (default: 5 blocks)
     */
    constructor(
        scene,
        blockX,
        blockY,
        offsetX = 0,
        offsetY = 0,
        player = null,
        patrolWidth = 5 * 64 // 5 blocks by default (wider than snail)
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
        this.speed = 50; // Slightly faster than snail
        this.direction = 1; // 1 for right, -1 for left
        this.startX = null; // Will be set after positioning

        // Pause state for when hit
        this.isPaused = false;
        this.pauseEndTime = 0;

        // Create the drummy sprite
        this.sprite = scene.physics.add.sprite(0, 0, "drum_rest");

        // Set up physics
        this.setupPhysics();

        // Position the drummy using block coordinates
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
        this.sprite.body.setSize(48, 32, true); // Adjust collision box for drummy size
        this.sprite.body.setOffset(8, 16); // Center the collision box
    }

    setupPlatformCollisions() {
        // Collide with platforms so drummy doesn't fall through floor
        this.scene.physics.add.collider(this.sprite, this.scene.platforms);
    }

    setupCollisions(player) {
        // Set up collision with player
        this.scene.physics.add.overlap(
            player.getSprite(),
            this.sprite,
            (playerSprite, drummySprite) =>
                this.handlePlayerCollision(playerSprite, drummySprite),
            null,
            this.scene
        );
    }

    handlePlayerCollision(playerSprite, drummySprite) {
        // Get collision details
        const playerBody = playerSprite.body;
        const drummyBody = drummySprite.body;

        // Check if player is jumping on the drummy (from above)
        const playerBottom = playerBody.bottom;
        const drummyTop = drummyBody.top;
        const isJumpingOn =
            playerBody.velocity.y > 0 && playerBottom <= drummyTop + 30;

        if (isJumpingOn) {
            // Player jumped on drummy - drummy launches player VERY high!
            this.launchPlayer(playerSprite);
        } else {
            // Side collision - player dies (reset level)
            this.killPlayer();
        }
    }

    launchPlayer(playerSprite) {
        // Launch the player very high - much higher than normal bounce!
        playerSprite.setVelocityY(-1400); // Very strong upward velocity

        // Optional: Add visual effect or sound here
        console.log("Drummy launched player high!");

        // Change drummy sprite to show it was activated
        this.sprite.setTexture("drum_hurt");

        // Pause the drummy for 1 second
        this.isPaused = true;
        this.pauseEndTime = this.scene.time.now + 1000;
        this.sprite.setVelocityX(0); // Stop movement immediately
    }

    killPlayer() {
        // Emit player death event instead of directly restarting
        EventBus.emit("player-died");
    }

    /**
     * Position the drummy using block coordinates (bottom-up system)
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
     * Update drummy movement and patrol logic
     */
    update() {
        if (!this.sprite || !this.sprite.body) return;

        // Stop movement when game is paused (not in sequencer mode)
        if (!this.scene.isSequencerMode) {
            this.sprite.setVelocityX(0);
            return;
        }

        // Check if drummy is paused
        if (this.isPaused) {
            // Ensure drummy stays still and keeps hurt texture during pause
            this.sprite.setVelocityX(0);
            this.sprite.setTexture("drum_hurt");

            if (this.scene.time.now >= this.pauseEndTime) {
                // Pause is over, resume normal behavior
                this.isPaused = false;
            } else {
                // Still paused, don't do anything else
                return;
            }
        }

        // Check patrol bounds
        const leftBound = this.startX - this.patrolWidth / 2;
        const rightBound = this.startX + this.patrolWidth / 2;

        // Check if drummy hit patrol bounds
        if (this.sprite.x <= leftBound && this.direction === -1) {
            this.direction = 1; // Turn right
            this.sprite.setFlipX(false);
        } else if (this.sprite.x >= rightBound && this.direction === 1) {
            this.direction = -1; // Turn left
            this.sprite.setFlipX(true);
        }

        // Check if drummy hit a wall (for when it encounters blocks)
        if (this.sprite.body.blocked.left && this.direction === -1) {
            this.direction = 1; // Turn right
            this.sprite.setFlipX(false);
        } else if (this.sprite.body.blocked.right && this.direction === 1) {
            this.direction = -1; // Turn left
            this.sprite.setFlipX(true);
        }

        // Apply movement
        this.sprite.setVelocityX(this.speed * this.direction);

        // Use crawling animation while moving
        if (this.sprite.body.velocity.x !== 0) {
            // Moving - play crawling animation
            if (
                !this.sprite.anims.isPlaying ||
                this.sprite.anims.currentAnim.key !== "drum_crawl"
            ) {
                this.sprite.play("drum_crawl");
            }
        } else {
            // Stationary - stop animation and use rest texture
            if (this.sprite.anims.isPlaying) {
                this.sprite.stop();
            }
            if (this.sprite.texture.key !== "drum_rest") {
                this.sprite.setTexture("drum_rest");
            }
        }
    }

    /**
     * Get the sprite for external access
     */
    getSprite() {
        return this.sprite;
    }

    /**
     * Respawn the drummy if it has been destroyed
     */
    respawn() {
        if (this.sprite) return; // Already exists, no need to respawn

        // Recreate the sprite
        this.sprite = this.scene.physics.add.sprite(0, 0, "drum_rest");

        // Set up physics again
        this.setupPhysics();

        // Position the drummy using stored spawn parameters
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

        console.log("Drummy respawned");
    }

    /**
     * Reset drummy to initial position and state
     */
    resetToInitialState() {
        if (!this.initialPosition) return;

        // Respawn if the drummy was destroyed
        this.respawn();

        // Reset position using stored initial values
        this.sprite.setPosition(this.initialPosition.x, this.initialPosition.y);
        this.sprite.setVelocity(0, 0);
        this.sprite.setFlipX(this.initialPosition.flipX);

        // Stop any animation and reset to rest texture
        if (this.sprite.anims.isPlaying) {
            this.sprite.stop();
        }
        this.sprite.setTexture("drum_rest");

        // Reset drummy state
        this.direction = this.initialPosition.direction;
        this.startX = this.initialPosition.startX;

        // Reset pause state
        this.isPaused = false;
        this.pauseEndTime = 0;
    }

    /**
     * Destroy the drummy and clean up
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

