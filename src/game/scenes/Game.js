import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { DebugTools } from "../debug";
import { ExitSign } from "../objects/ExitSign";
import { OneWayPlatform } from "../objects/OneWayPlatform";
import { Player } from "../objects/Player";
import { Bridge } from "../objects/Bridge";
import { Snail } from "../objects/Snail";

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
    createBlockAt(blockX, blockY, texture, offsetX = 0, offsetY = 0) {
        // Use world height instead of viewport height since we expanded the world
        const worldHeight = this.physics.world.bounds.height;

        // Convert block coordinates to pixel coordinates
        // Blocks are positioned by their center
        const pixelX = blockX * this.blockSize + this.blockSize / 2 + offsetX;
        const pixelY =
            worldHeight -
            (blockY + 1) * this.blockSize +
            this.blockSize / 2 +
            offsetY;

        return this.platforms.create(pixelX, pixelY, texture);
    }

    /**
     * Reset all moving objects to their initial positions
     * This is used for start/stop but not pause functionality
     */
    resetMovingObjectsToInitialPositions() {
        console.log("Resetting moving objects to initial positions...");

        // Reset player
        if (this.player) {
            this.player.resetToInitialState();
            console.log("Player reset to initial position");
        }

        // Reset snail
        if (this.snail) {
            this.snail.resetToInitialState();
            console.log("Snail reset to initial position");
        }
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

        // Create extended floor - cover much more ground for the larger world
        const blocksPerRow = Math.ceil(worldWidth / this.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player using the Player class
        this.player = new Player(this, this.platforms, 200);

        // Create snail enemy
        this.snail = new Snail(this, 15, 1, 0, 0, this.player, 4 * 64);

        // Player animations and controls are now handled by the Player class

        new ExitSign(this, 30, 1, 0, 0, this.player);

        this.createBlockAt(6, 2, "dirt_block", -30, -20);
        this.createBlockAt(11, 1, "dirt_block", -20, -20);
        this.createBlockAt(11, 2, "dirt_block", -20, -20);
        this.createBlockAt(12, 2, "dirt_block", -20, -20);
        this.createBlockAt(12, 3, "dirt_block", -20, -20);

        new OneWayPlatform(this, 7, 2, -20, 10, this.player);

        new Bridge(this, 8, 2, -0, 3, this.player);
        new Bridge(this, 9, 2, -20, 3, this.player);
        new Bridge(this, 10, 2, -20, 3, this.player);

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
    }

    onSequencerStarted(data) {
        console.log("Sequencer started with data:", data);

        // Reset moving objects to initial positions
        this.resetMovingObjectsToInitialPositions();

        // Enter sequencer mode
        this.isSequencerMode = true;
        this.sequencerData = data;

        console.log("Entered sequencer mode with clean reset");

        // Notify sequencer that scene is ready to start playback
        EventBus.emit("sequencer-ready-to-play");
    }

    onSequencerStopped() {
        console.log("Sequencer stopped");

        // Reset moving objects to initial positions
        this.resetMovingObjectsToInitialPositions();

        // Exit sequencer mode - return to manual controls
        this.isSequencerMode = false;
        this.sequencerData = null;

        console.log("Exited sequencer mode with clean reset");
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

        // Use the player's sequencer movement handler
        this.player.handleSequencerMovement(activeBeats);
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
                    this.player.getBody(),
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

        // Update player using the Player class
        if (this.player) {
            this.player.update();
        }

        // Update snail enemy
        if (this.snail) {
            this.snail.update();
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

