import { PlayerConfig } from "../playerConfig";

export class Player {
    constructor(scene, platforms, x = 200, y = null) {
        this.scene = scene;
        this.platforms = platforms;

        // Calculate player Y position from bottom of world if not provided
        if (y === null) {
            const worldHeight = scene.physics.world.bounds.height;
            y = worldHeight - 120; // Position from the bottom of the larger world
        }

        // Create the player sprite
        this.sprite = scene.physics.add.sprite(x, y, "character_idle");

        // Set up physics properties
        this.setupPhysics();

        // Set up animations
        this.setupAnimations();

        // Set up controls
        this.setupControls();

        // Set up collisions
        this.setupCollisions();

        // Set up camera following
        this.setupCamera();
    }

    setupPhysics() {
        // Remove bounce for snappier movement
        this.sprite.setBounce(0);
        this.sprite.setCollideWorldBounds(true);

        // Set collision body size and offset
        this.sprite.body.setSize(
            PlayerConfig.bodyWidth,
            PlayerConfig.bodyHeight,
            true
        );
        this.sprite.body.setOffset(
            PlayerConfig.bodyOffsetX,
            PlayerConfig.bodyOffsetY
        );

        // Make player more responsive with higher gravity and air resistance
        // Adjusted for 64px blocks (doubled from previous 32px blocks)
        this.sprite.body.setGravityY(PlayerConfig.gravity); // Faster falling (scaled for larger blocks)
        this.sprite.setDragX(PlayerConfig.dragX); // Quick stopping when not moving
    }

    setupAnimations() {
        // Create animations only if they don't already exist
        if (!this.scene.anims.exists("walk")) {
            this.scene.anims.create({
                key: "walk",
                frames: [
                    { key: "character_walk_a" },
                    { key: "character_walk_b" },
                ],
                frameRate: PlayerConfig.walkFrameRate,
                repeat: -1,
            });
        }

        if (!this.scene.anims.exists("jump")) {
            this.scene.anims.create({
                key: "jump",
                frames: [{ key: "character_jump" }],
                frameRate: PlayerConfig.jumpFrameRate,
            });
        }

        if (!this.scene.anims.exists("idle")) {
            this.scene.anims.create({
                key: "idle",
                frames: [{ key: "character_idle" }],
                frameRate: PlayerConfig.idleFrameRate,
            });
        }
    }

    setupControls() {
        // Controls will be handled by the scene, but we store reference for access
        this.cursors = this.scene.input.keyboard.createCursorKeys();
    }

    setupCollisions() {
        // Player physics with platforms
        this.scene.physics.add.collider(this.sprite, this.platforms);
    }

    setupCamera() {
        // Set up camera to follow the player
        this.scene.cameras.main.startFollow(this.sprite);
        this.scene.cameras.main.setLerp(0.05, 0.05); // Smooth camera following
        this.scene.cameras.main.setZoom(1); // Adjust zoom if needed

        const worldWidth = this.scene.physics.world.bounds.width;
        const worldHeight = this.scene.physics.world.bounds.height;
        this.scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    }

    /**
     * Handle sequencer-based movement
     * @param {Array} activeBeats - Array of boolean values for each drum track
     */
    handleSequencerMovement(activeBeats) {
        // Only process if player exists
        if (!this.sprite) return;

        // Process each drum track action
        // Track indices: [Kick, Snare, Hi-Hat, Open Hat]

        // Kick (index 0) = Jump
        if (activeBeats[0] && this.sprite.body.touching.down) {
            this.sprite.setVelocityY(PlayerConfig.jumpVelocity); // Same jump strength as manual controls
            this.sprite.anims.play("jump", true);
            console.log("Beat action: JUMP");
        }

        // Snare (index 1) = Nothing for now
        if (activeBeats[1]) {
            console.log("Beat action: SNARE (no action)");
        }

        // Hi-Hat (index 2) = Go Right
        if (activeBeats[2]) {
            this.sprite.setVelocityX(PlayerConfig.horizontalSpeed); // Same speed as manual controls
            this.sprite.anims.play("walk", true);
            this.sprite.setFlipX(false); // Face right
            console.log("Beat action: RIGHT");
        }

        // Open Hat (index 3) = Go Left
        if (activeBeats[3]) {
            this.sprite.setVelocityX(-PlayerConfig.horizontalSpeed); // Same speed as manual controls
            this.sprite.anims.play("walk", true);
            this.sprite.setFlipX(true); // Face left
            console.log("Beat action: LEFT");
        }

        // If no horizontal movement beats are active, let drag handle stopping
        if (!activeBeats[2] && !activeBeats[3]) {
            // Don't explicitly set velocity to 0, let the drag system handle it naturally
            // This allows for more natural movement between beats
        }
    }

    /**
     * Handle manual player movement
     */
    handleManualMovement() {
        // Player movement - adjusted for 64px blocks
        if (this.cursors.left.isDown) {
            this.sprite.setVelocityX(-PlayerConfig.horizontalSpeed);
            this.sprite.anims.play("walk", true);
            this.sprite.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.sprite.setVelocityX(PlayerConfig.horizontalSpeed);
            this.sprite.anims.play("walk", true);
            this.sprite.setFlipX(false);
        } else {
            // Let drag handle stopping for more responsive feel
            this.sprite.anims.play("idle", true);
        }

        // Jumping - adjusted for 64px blocks
        if (this.cursors.up.isDown && this.sprite.body.touching.down) {
            this.sprite.setVelocityY(PlayerConfig.jumpVelocity);
            this.sprite.anims.play("jump", true);
        }
    }

    /**
     * Handle idle animation for sequencer mode
     */
    handleSequencerIdle() {
        // In sequencer mode, show idle animation when no beats are playing
        // The sequencer step handler will override this when beats are active
        if (
            !this.sprite.anims.isPlaying ||
            (this.sprite.anims.currentAnim &&
                this.sprite.anims.currentAnim.key !== "walk" &&
                this.sprite.anims.currentAnim.key !== "jump")
        ) {
            this.sprite.anims.play("idle", true);
        }
    }

    /**
     * Update player state - called from scene's update method
     * @param {boolean} isSequencerMode - Whether sequencer mode is active
     */
    update(isSequencerMode = false) {
        if (!isSequencerMode) {
            this.handleManualMovement();
        } else {
            this.handleSequencerIdle();
        }
    }

    /**
     * Get the player sprite for external access
     */
    getSprite() {
        return this.sprite;
    }

    /**
     * Get the player's physics body for external access
     */
    getBody() {
        return this.sprite.body;
    }

    /**
     * Destroy the player and clean up
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

