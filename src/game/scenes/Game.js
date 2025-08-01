import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { DebugTools } from "../debug";
import { PlayerConfig } from "../playerConfig";
import { ExitSign } from "../objects/ExitSign";

export class Game extends Scene {
    constructor() {
        super("Game");
        this.blockSize = 64;
        this.blockOffset = 32;

        // Sequencer state management
        this.isSequencerMode = false;
        this.sequencerData = null;
    }

    /**
     * Helper function to create a block at block coordinates
     * @param {number} blockX - Block X coordinate (0 = leftmost)
     * @param {number} blockY - Block Y coordinate (0 = bottom row)
     * @param {string} texture - The texture key for the block
     * @returns {Phaser.Physics.Arcade.Sprite} The created block sprite
     */
    createBlockAt(blockX, blockY, texture) {
        // Use world height instead of viewport height since we expanded the world
        const worldHeight = this.physics.world.bounds.height;

        // Convert block coordinates to pixel coordinates
        // Blocks are positioned by their center
        const pixelX = blockX * this.blockSize + this.blockSize / 2;
        const pixelY =
            worldHeight - (blockY + 1) * this.blockSize + this.blockSize / 2;

        return this.platforms.create(pixelX, pixelY, texture);
    }

    create() {
        // Get dynamic game dimensions
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Set up much larger world bounds - 5x larger than viewport
        const worldWidth = gameWidth * 5;
        const worldHeight = gameHeight * 5;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Create platforms group
        this.platforms = this.physics.add.staticGroup();

        this.createBlockAt(6, 1, "dirt_block");
        this.createBlockAt(8, 3, "dirt_block");

        this.createBlockAt(11, 1, "dirt_block");
        this.createBlockAt(12, 2, "dirt_block");
        this.createBlockAt(13, 3, "dirt_block");

        // Create extended floor - cover much more ground for the larger world
        const blocksPerRow = Math.ceil(worldWidth / this.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player - position within the larger world, from the bottom
        const playerY = worldHeight - 120; // Position from the bottom of the larger world

        this.player = this.physics.add.sprite(
            200, // Start a bit into the world horizontally
            playerY,
            "character_idle"
        );
        // Remove bounce for snappier movement
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);

        // Set up camera to follow the player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(0.05, 0.05); // Smooth camera following
        this.cameras.main.setZoom(1); // Adjust zoom if needed
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        this.player.body.setSize(
            PlayerConfig.bodyWidth,
            PlayerConfig.bodyHeight,
            true
        );
        this.player.body.setOffset(
            PlayerConfig.bodyOffsetX,
            PlayerConfig.bodyOffsetY
        );

        // Make player more responsive with higher gravity and air resistance
        // Adjusted for 64px blocks (doubled from previous 32px blocks)
        this.player.body.setGravityY(PlayerConfig.gravity); // Faster falling (scaled for larger blocks)
        this.player.setDragX(PlayerConfig.dragX); // Quick stopping when not moving

        // Player physics
        this.physics.add.collider(this.player, this.platforms);

        // Create animations only if they don't already exist
        if (!this.anims.exists("walk")) {
            this.anims.create({
                key: "walk",
                frames: [
                    { key: "character_walk_a" },
                    { key: "character_walk_b" },
                ],
                frameRate: PlayerConfig.walkFrameRate,
                repeat: -1,
            });
        }

        if (!this.anims.exists("jump")) {
            this.anims.create({
                key: "jump",
                frames: [{ key: "character_jump" }],
                frameRate: PlayerConfig.jumpFrameRate,
            });
        }

        if (!this.anims.exists("idle")) {
            this.anims.create({
                key: "idle",
                frames: [{ key: "character_idle" }],
                frameRate: PlayerConfig.idleFrameRate,
            });
        }

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create exit sign - place it somewhere in the world
        this.exitSign = new ExitSign(this, 0, 0);
        this.exitSign.setBlockPosition(20, 1); // Place it at block position 20, 1 (right side of initial area)

        // Debug tools - all disabled by default but can be toggled with controls

        // Grid overlay - not created by default, but can be toggled with 'G' key
        // (Grid will be created when first toggled)

        // Player debug info - not created by default, but can be toggled with 'P' key
        // (Debug info will be created when first toggled)

        // Collision zone visualization - disabled by default
        this.showCollisions = false;

        // Add keyboard controls for toggling debug features
        // C = Toggle collision zones, G = Toggle grid overlay, P = Toggle player debug info
        this.debugKeys = this.input.keyboard.addKeys("C,G,P");

        // Listen for sequencer events (for future use)
        EventBus.on("sequencer-started", this.onSequencerStarted, this);
        EventBus.on("sequencer-stopped", this.onSequencerStopped, this);
        EventBus.on("sequencer-step", this.onSequencerStep, this);

        // Listen for debug toggle events
        EventBus.on("toggle-grid", this.onToggleGrid, this);
        EventBus.on("toggle-collisions", this.onToggleCollisions, this);

        EventBus.emit("current-scene-ready", this);

        // Check if we should enter sequencer mode after scene restart
        const shouldEnterSequencerMode =
            this.registry.get("enterSequencerMode");
        const storedSequencerData = this.registry.get("sequencerData");

        if (shouldEnterSequencerMode && storedSequencerData) {
            // Clean up the registry flags
            this.registry.remove("enterSequencerMode");
            this.registry.remove("sequencerData");

            // Enter sequencer mode
            this.isSequencerMode = true;
            this.sequencerData = storedSequencerData;

            console.log("Entered sequencer mode after scene restart");

            // Notify sequencer that scene is ready to start playback
            EventBus.emit("sequencer-ready-to-play");
        }
    }

    onSequencerStarted(data) {
        console.log("Sequencer started with data:", data);

        // Store sequencer data for use after scene restart
        this.registry.set("sequencerData", data);
        this.registry.set("enterSequencerMode", true);

        // Temporarily exit sequencer mode to prevent step events during restart
        this.isSequencerMode = false;

        // Restart the entire scene for a clean reset
        this.scene.restart();
    }

    onSequencerStopped() {
        console.log("Sequencer stopped");

        // Exit sequencer mode - return to manual controls
        this.isSequencerMode = false;
        this.sequencerData = null;

        console.log("Exited sequencer mode - restarting scene for fresh start");

        // Restart the scene for a clean reset, just like when starting
        this.scene.restart();
    }

    onSequencerStep(data) {
        console.log(
            "Sequencer step:",
            data.currentStep,
            "Active beats:",
            data.activeBeats
        );

        // Only process if we're in sequencer mode and player exists
        if (!this.isSequencerMode || !this.player) return;

        const { activeBeats } = data;

        // Process each drum track action
        // Track indices: [Kick, Snare, Hi-Hat, Open Hat]

        // Kick (index 0) = Jump
        if (activeBeats[0] && this.player.body.touching.down) {
            this.player.setVelocityY(PlayerConfig.jumpVelocity); // Same jump strength as manual controls
            this.player.anims.play("jump", true);
            console.log("Beat action: JUMP");
        }

        // Snare (index 1) = Nothing for now
        if (activeBeats[1]) {
            console.log("Beat action: SNARE (no action)");
        }

        // Hi-Hat (index 2) = Go Right
        if (activeBeats[2]) {
            this.player.setVelocityX(PlayerConfig.horizontalSpeed); // Same speed as manual controls
            this.player.anims.play("walk", true);
            this.player.setFlipX(false); // Face right
            console.log("Beat action: RIGHT");
        }

        // Open Hat (index 3) = Go Left
        if (activeBeats[3]) {
            this.player.setVelocityX(-PlayerConfig.horizontalSpeed); // Same speed as manual controls
            this.player.anims.play("walk", true);
            this.player.setFlipX(true); // Face left
            console.log("Beat action: LEFT");
        }

        // If no horizontal movement beats are active, let drag handle stopping
        if (!activeBeats[2] && !activeBeats[3]) {
            // Don't explicitly set velocity to 0, let the drag system handle it naturally
            // This allows for more natural movement between beats
        }
    }

    // Debug toggle event handlers
    onToggleGrid(visible) {
        // Create grid overlay if it doesn't exist yet
        if (!this.gridGraphics) {
            DebugTools.createGridOverlay(this, this.blockSize);
        }
        DebugTools.setGridVisible(this, visible);
    }

    onToggleCollisions(visible) {
        DebugTools.setCollisionZonesVisible(this, visible);
    }

    update() {
        // Debug controls
        if (Phaser.Input.Keyboard.JustDown(this.debugKeys.C)) {
            DebugTools.toggleCollisionZones(this);
        }

        if (Phaser.Input.Keyboard.JustDown(this.debugKeys.G)) {
            // Create grid overlay if it doesn't exist yet
            if (!this.gridGraphics) {
                DebugTools.createGridOverlay(this, this.blockSize);
            }
            DebugTools.toggleGrid(this);
        }

        if (Phaser.Input.Keyboard.JustDown(this.debugKeys.P)) {
            // Toggle player debug info
            if (!this.playerDebugText) {
                this.playerDebugText = DebugTools.createBodyDebugInfo(
                    this,
                    this.player.body,
                    "Player"
                );
            } else {
                this.playerDebugText.visible = !this.playerDebugText.visible;
            }
        }

        // Update collision visualization if enabled
        if (this.showCollisions) {
            DebugTools.showCollisionZones(this, {
                lineColor: 0xff0000, // Red outline
                fillColor: 0xff0000, // Red fill
                fillAlpha: 0.2, // Semi-transparent
                lineAlpha: 0.8, // More opaque outline
                lineWidth: 2,
            });
        }

        // Only allow manual controls when NOT in sequencer mode
        if (!this.isSequencerMode) {
            // Player movement - adjusted for 64px blocks
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(-PlayerConfig.horizontalSpeed);
                this.player.anims.play("walk", true);
                this.player.setFlipX(true);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(PlayerConfig.horizontalSpeed);
                this.player.anims.play("walk", true);
                this.player.setFlipX(false);
            } else {
                // Let drag handle stopping for more responsive feel
                this.player.anims.play("idle", true);
            }

            // Jumping - adjusted for 64px blocks
            if (this.cursors.up.isDown && this.player.body.touching.down) {
                this.player.setVelocityY(PlayerConfig.jumpVelocity);
                this.player.anims.play("jump", true);
            }
        } else {
            // In sequencer mode, show idle animation when no beats are playing
            // The sequencer step handler will override this when beats are active
            if (
                !this.player.anims.isPlaying ||
                (this.player.anims.currentAnim &&
                    this.player.anims.currentAnim.key !== "walk" &&
                    this.player.anims.currentAnim.key !== "jump")
            ) {
                this.player.anims.play("idle", true);
            }
        }
    }

    // Clean up event listeners when scene is destroyed
    destroy() {
        EventBus.off("sequencer-started", this.onSequencerStarted, this);
        EventBus.off("sequencer-stopped", this.onSequencerStopped, this);
        EventBus.off("sequencer-step", this.onSequencerStep, this);
        EventBus.off("toggle-grid", this.onToggleGrid, this);
        EventBus.off("toggle-collisions", this.onToggleCollisions, this);
        super.destroy();
    }
}

