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

        // Dash state management
        this.isDashing = false;
        this.dashDirection = 0; // -1 for left, 1 for right, 0 for no direction
        this.dashTimer = null;

        // Jump state management
        this.hasJumped = false; // Track if player has jumped to prevent multiple jumps from holding key

        // Simulated key states for sequencer mode
        this.simulatedKeys = {
            left: false,
            right: false,
            jump: false,
            dash: false,
        };

        // Store initial position and state for reset functionality
        this.initialPosition = {
            x: this.sprite.x,
            y: this.sprite.y,
            flipX: this.sprite.flipX || false,
        };

        // Trace functionality for sequencer mode
        this.trace = {
            graphics: null,
            points: [],
            lastRecordedPosition: null,
            isRecording: false,
            minDistance: 5, // Minimum distance between trace points to avoid clutter
        };
        this.setupTrace();
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

        // Add WASD keys
        this.wasdKeys = {
            W: this.scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.W
            ),
            A: this.scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.A
            ),
            S: this.scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.S
            ),
            D: this.scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.D
            ),
        };

        // Add spacebar for jumping
        this.spaceKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // Add shift key for dashing
        this.shiftKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SHIFT
        );
    }

    setupCollisions() {
        // Player physics with platforms
        this.scene.physics.add.collider(this.sprite, this.platforms);
    }

    setupCamera() {
        // Set up camera to follow the player
        this.scene.cameras.main.startFollow(this.sprite);
        this.scene.cameras.main.setLerp(0.05, 0.05); // Smooth camera following

        // Detect phone mode: when canvas is higher than it is wide
        const gameWidth = this.scene.sys.game.config.width;
        const isPhoneMode = gameWidth < 768;
        const isTabletMode = gameWidth >= 768 && gameWidth < 1024;

        // Set zoom level based on device orientation
        const zoomLevel = isPhoneMode ? 0.5 : isTabletMode ? 0.7 : 1.2;
        this.scene.cameras.main.setZoom(zoomLevel);

        const worldWidth = this.scene.physics.world.bounds.width;
        const worldHeight = this.scene.physics.world.bounds.height;
        this.scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    }

    setupTrace() {
        // Create graphics object for drawing the trace
        this.trace.graphics = this.scene.add.graphics();
        this.trace.graphics.setDepth(-1); // Draw behind other objects
    }

    startTrace() {
        // Start recording trace when sequencer mode begins
        this.trace.isRecording = true;
        this.trace.points = [];
        this.trace.lastRecordedPosition = null;
        this.clearTrace();
    }

    stopTrace() {
        // Stop recording trace when sequencer mode ends
        // Keep the trace visible so user can see the path taken
        this.trace.isRecording = false;
    }

    clearTrace() {
        // Clear the visual trace
        if (this.trace.graphics) {
            this.trace.graphics.clear();
        }
    }

    addTracePoint() {
        if (!this.trace.isRecording || !this.sprite) return;

        const currentPos = {
            x: this.sprite.x,
            y: this.sprite.y,
        };

        // Only add point if we've moved far enough from the last recorded position
        if (this.trace.lastRecordedPosition) {
            const distance = Phaser.Math.Distance.Between(
                currentPos.x,
                currentPos.y,
                this.trace.lastRecordedPosition.x,
                this.trace.lastRecordedPosition.y
            );

            if (distance < this.trace.minDistance) {
                return; // Too close to last point, skip
            }
        }

        // Add the point to our trace
        this.trace.points.push(currentPos);
        this.trace.lastRecordedPosition = currentPos;

        // Draw the trace
        this.drawTrace();
    }

    drawTrace() {
        if (!this.trace.graphics || this.trace.points.length < 2) return;

        // Clear previous trace
        this.trace.graphics.clear();

        // Set line style for the trace
        this.trace.graphics.lineStyle(3, 0xffffff, 0.8); // White line with 80% opacity

        // Draw the path as a continuous line
        this.trace.graphics.beginPath();

        // Start from the first point
        const firstPoint = this.trace.points[0];
        this.trace.graphics.moveTo(firstPoint.x, firstPoint.y);

        // Draw lines to each subsequent point
        for (let i = 1; i < this.trace.points.length; i++) {
            const point = this.trace.points[i];
            this.trace.graphics.lineTo(point.x, point.y);
        }

        this.trace.graphics.strokePath();

        // Add small dots at each recorded point for better visibility
        this.trace.graphics.fillStyle(0xffffff, 1); // Solid white dots
        this.trace.points.forEach((point) => {
            this.trace.graphics.fillCircle(point.x, point.y, 1.5);
        });
    }

    /**
     * Handle sequencer-based movement by simulating key presses
     * @param {Array} activeBeats - Array of boolean values for each drum track
     */
    handleSequencerMovement(activeBeats) {
        // Only process if player exists
        if (!this.sprite) return;

        // Clear previous simulated key states
        this.simulatedKeys.left = false;
        this.simulatedKeys.right = false;
        this.simulatedKeys.jump = false;
        this.simulatedKeys.dash = false;

        // Process each drum track action by setting simulated key states
        // Track indices: [Kick, Snare, Hi-Hat, Open Hat]

        // Kick (index 0) = Jump
        if (activeBeats[0]) {
            this.simulatedKeys.jump = true;
            console.log("Beat action: JUMP (simulated)");
        }

        // Snare (index 1) = Dash
        if (activeBeats[1]) {
            this.simulatedKeys.dash = true;
            console.log("Beat action: DASH (simulated)");
        }

        // Hi-Hat (index 2) = Go Right
        if (activeBeats[2]) {
            this.simulatedKeys.right = true;
            console.log("Beat action: RIGHT (simulated)");
        }

        // Open Hat (index 3) = Go Left
        if (activeBeats[3]) {
            this.simulatedKeys.left = true;
            console.log("Beat action: LEFT (simulated)");
        }
    }

    /**
     * Perform a dash move in the direction the player is facing
     */
    performDash() {
        if (this.isDashing) return; // Prevent multiple dashes

        // Determine dash direction based on player's current facing direction
        // If player is flipped (facing left), dash left, otherwise dash right
        this.dashDirection = this.sprite.flipX ? -1 : 1;

        // Set dash state
        this.isDashing = true;

        // Apply dash velocity
        this.sprite.setVelocityX(PlayerConfig.dashSpeed * this.dashDirection);

        // Play jump animation as requested
        this.sprite.anims.play("jump", true);

        // Set timer to end dash
        if (this.dashTimer) {
            this.scene.time.removeEvent(this.dashTimer);
        }

        this.dashTimer = this.scene.time.delayedCall(
            PlayerConfig.dashDuration,
            () => {
                this.endDash();
            }
        );
    }

    /**
     * End the dash move
     */
    endDash() {
        this.isDashing = false;
        this.dashDirection = 0;

        // Reduce velocity but don't stop completely to allow for fluid movement
        if (this.sprite.body) {
            const currentVel = this.sprite.body.velocity.x;
            this.sprite.setVelocityX(currentVel * 0.3); // Reduce to 30% of dash speed
        }

        if (this.dashTimer) {
            this.scene.time.removeEvent(this.dashTimer);
            this.dashTimer = null;
        }
    }

    /**
     * Handle manual player movement (now also handles simulated sequencer input)
     */
    handleManualMovement() {
        // Helper functions to check for input combinations (real keys + simulated keys)
        const isLeftPressed =
            this.cursors.left.isDown ||
            this.wasdKeys.A.isDown ||
            this.simulatedKeys.left;
        const isRightPressed =
            this.cursors.right.isDown ||
            this.wasdKeys.D.isDown ||
            this.simulatedKeys.right;
        const isJumpPressed =
            this.cursors.up.isDown ||
            this.wasdKeys.W.isDown ||
            this.spaceKey.isDown ||
            this.simulatedKeys.jump;
        const isDashPressed = this.shiftKey.isDown || this.simulatedKeys.dash;

        // Check for dash input (dash key only, direction based on current facing)
        if (
            isDashPressed &&
            !this.isDashing &&
            !this.sprite.body.touching.down
        ) {
            // If direction keys are pressed, use those to set facing direction first
            if (isLeftPressed) {
                this.sprite.setFlipX(true); // Face left before dashing
                this.performDash();
                return; // Exit early to prevent regular movement
            } else if (isRightPressed) {
                this.sprite.setFlipX(false); // Face right before dashing
                this.performDash();
                return; // Exit early to prevent regular movement
            } else {
                // No direction key pressed, dash in current facing direction
                this.performDash();
                return; // Exit early to prevent regular movement
            }
        }

        // Regular player movement - adjusted for 64px blocks
        // Don't override movement when dashing
        if (!this.isDashing) {
            if (isLeftPressed) {
                this.sprite.setVelocityX(-PlayerConfig.horizontalSpeed);
                this.sprite.anims.play("walk", true);
                this.sprite.setFlipX(true);
            } else if (isRightPressed) {
                this.sprite.setVelocityX(PlayerConfig.horizontalSpeed);
                this.sprite.anims.play("walk", true);
                this.sprite.setFlipX(false);
            } else {
                // Let drag handle stopping for more responsive feel
                this.sprite.anims.play("idle", true);
            }
        }

        // Jumping - adjusted for 64px blocks
        // Reset jump flag when on ground and not jumping
        if (this.sprite.body.touching.down && !isJumpPressed) {
            this.hasJumped = false;
        }

        // Only jump if on ground, jump key pressed, and haven't already jumped
        if (
            isJumpPressed &&
            this.sprite.body.touching.down &&
            !this.hasJumped
        ) {
            this.sprite.setVelocityY(PlayerConfig.jumpVelocity);
            this.sprite.anims.play("jump", true);
            this.hasJumped = true; // Prevent multiple jumps while holding key
        }
    }

    /**
     * Update player state - called from scene's update method
     * Always uses the unified movement logic that handles both real keys and simulated input
     */
    update() {
        this.handleManualMovement();

        // Add trace point if we're recording
        if (this.trace.isRecording) {
            this.addTracePoint();
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
     * Reset player to initial position and state
     */
    resetToInitialState() {
        if (!this.sprite || !this.initialPosition) return;

        // Reset position using stored initial values
        this.sprite.setPosition(this.initialPosition.x, this.initialPosition.y);
        this.sprite.setVelocity(0, 0);
        this.sprite.setFlipX(this.initialPosition.flipX);

        // Reset player state
        if (this.isDashing) {
            this.endDash();
        }
        this.hasJumped = false;

        // Clear simulated keys
        this.simulatedKeys = {
            left: false,
            right: false,
            jump: false,
            dash: false,
        };

        // Play idle animation
        this.sprite.anims.play("idle", true);

        // Stop trace recording but don't clear it
        this.stopTrace();
    }

    /**
     * Destroy the player and clean up
     */
    destroy() {
        // Clean up dash timer
        if (this.dashTimer) {
            this.scene.time.removeEvent(this.dashTimer);
            this.dashTimer = null;
        }

        // Clean up trace graphics
        if (this.trace && this.trace.graphics) {
            this.trace.graphics.destroy();
            this.trace.graphics = null;
        }

        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

