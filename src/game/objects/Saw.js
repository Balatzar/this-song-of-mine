import { EventBus } from "../EventBus";

/**
 * Saw Enemy game object
 * Starts dormant (saw_rest.png) and when crash instrument is triggered,
 * it wakes up, spins, moves down fast, then up slowly
 */
export class Saw {
    /**
     * Create a saw enemy
     * @param {Scene} scene - The Phaser scene
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
     * @param {number} offsetX - Pixel offset from block position (default: 0)
     * @param {number} offsetY - Pixel offset from block position (default: 0)
     * @param {Player} player - Player object for collision setup
     * @param {number} dropDistance - How far down the saw moves (default: 3 blocks)
     */
    constructor(
        scene,
        blockX,
        blockY,
        offsetX = 0,
        offsetY = 0,
        player = null,
        dropDistance = 3 * 64 // 3 blocks by default
    ) {
        this.scene = scene;
        this.player = player;
        this.dropDistance = dropDistance;

        // Store constructor parameters for respawning
        this.spawnParams = {
            blockX,
            blockY,
            offsetX,
            offsetY,
        };

        // Movement state
        this.state = "dormant"; // "dormant", "dropping", "returning"
        this.dropSpeed = 400; // Fast drop speed
        this.returnSpeed = 100; // Slow return speed
        this.startY = null; // Will be set after positioning
        this.targetY = null; // Drop target position

        // Create the saw sprite
        this.sprite = scene.physics.add.sprite(0, 0, "saw_rest");

        // Set up physics
        this.setupPhysics();

        // Position the saw using block coordinates
        this.setBlockPosition(blockX, blockY, offsetX, offsetY);

        // Store the starting position for movement bounds
        this.startY = this.sprite.y;
        this.targetY = this.startY + this.dropDistance;

        // Store initial position and state for reset functionality
        this.initialPosition = {
            x: this.sprite.x,
            y: this.sprite.y,
            state: "dormant",
            startY: this.startY,
        };

        // Set up collisions if player is provided
        if (player) {
            this.setupCollisions(player);
        }

        // Listen for crash instrument trigger
        EventBus.on("crash-triggered", this.onCrashTriggered, this);
    }

    setupPhysics() {
        // Enable physics and set properties
        this.sprite.setBounce(0);
        this.sprite.setCollideWorldBounds(false); // Allow movement beyond world bounds
        this.sprite.body.setSize(this.sprite.width, this.sprite.height);

        // Make the saw immovable (player can't push it)
        this.sprite.body.setImmovable(true);
        this.sprite.body.moves = false; // We'll control movement manually
    }

    /**
     * Convert block coordinates to pixel coordinates and position the saw
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
     * @param {number} offsetX - Pixel offset from block position
     * @param {number} offsetY - Pixel offset from block position
     */
    setBlockPosition(blockX, blockY, offsetX = 0, offsetY = 0) {
        const blockSize = this.scene.blockSize || 64;
        const worldHeight = this.scene.physics.world.bounds.height;

        // Calculate pixel position from block coordinates
        const pixelX = blockX * blockSize + blockSize / 2 + offsetX;
        const pixelY =
            worldHeight - (blockY + 1) * blockSize + blockSize / 2 + offsetY;

        this.sprite.setPosition(pixelX, pixelY);
    }

    setupCollisions(player) {
        // Add collision detection with player - saw kills on contact
        this.scene.physics.add.overlap(
            player.sprite,
            this.sprite,
            () => this.onPlayerCollision(),
            null,
            this.scene
        );
    }

    onPlayerCollision() {
        console.log("Player hit by saw!");
        EventBus.emit("player-died");
    }

    /**
     * Handle crash instrument being triggered
     */
    onCrashTriggered() {
        if (this.state === "dormant") {
            console.log("Saw awakened by crash!");
            this.state = "dropping";

            // Switch to spinning animation
            this.sprite.play("saw_spin");

            // Enable movement for dropping
            this.sprite.body.moves = true;
        }
    }

    /**
     * Update saw movement and state logic
     */
    update() {
        if (!this.sprite || !this.sprite.body) return;

        switch (this.state) {
            case "dormant":
                // Do nothing, just stay in rest position
                break;

            case "dropping":
                // Move down fast
                this.sprite.setVelocityY(this.dropSpeed);

                // Check if reached target position
                if (this.sprite.y >= this.targetY) {
                    this.state = "returning";
                    console.log("Saw reached bottom, returning up");
                }
                break;

            case "returning":
                // Move up slowly
                this.sprite.setVelocityY(-this.returnSpeed);

                // Check if returned to start position
                if (this.sprite.y <= this.startY) {
                    this.state = "dormant";
                    this.sprite.setPosition(this.sprite.x, this.startY);
                    this.sprite.setVelocityY(0);

                    // Switch back to rest sprite
                    this.sprite.setTexture("saw_rest");
                    this.sprite.body.moves = false;

                    console.log("Saw returned to dormant state");
                }
                break;
        }
    }

    /**
     * Reset the saw to its initial state
     */
    reset() {
        if (!this.sprite) return;

        console.log("Resetting saw to initial state");

        // Reset position and state
        this.sprite.setPosition(this.initialPosition.x, this.initialPosition.y);
        this.sprite.setVelocity(0, 0);
        this.state = "dormant";
        this.startY = this.initialPosition.startY;

        // Reset sprite to rest texture
        this.sprite.setTexture("saw_rest");
        this.sprite.body.moves = false;
    }

    /**
     * Get the sprite for external access
     */
    getSprite() {
        return this.sprite;
    }

    /**
     * Destroy the saw and clean up event listeners
     */
    destroy() {
        EventBus.off("crash-triggered", this.onCrashTriggered, this);

        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

