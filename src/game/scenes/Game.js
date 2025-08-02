import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { DebugTools } from "../debug";
import { Level1 } from "../levels/Level1";
import { Level2 } from "../levels/Level2";
import { Level3 } from "../levels/Level3";
import { Level4 } from "../levels/Level4";

export class Game extends Scene {
    constructor() {
        super("Game");
        this.blockSize = 64;
        this.blockOffset = 32;

        // Level management
        this.currentLevel = null;
        // this.availableLevels = [Level1, Level2, Level3];
        this.availableLevels = [Level4];
        this.currentLevelIndex = 0;

        // Sequencer state management
        this.isSequencerMode = false;
        this.sequencerData = null;

        // Loop limit system
        this.maxLoops = 2;
        this.currentLoop = 0;
        this.isGameOver = false;
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

        if (this.currentLevel) {
            // Reset player
            if (this.currentLevel.player) {
                this.currentLevel.player.resetToInitialState();
                console.log("Player reset to initial position");
            }

            // Reset all level objects (including enemies)
            this.currentLevel.resetToInitialState();
            console.log("Level objects reset to initial positions");
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

        // Initialize level system
        this.loadLevel(this.currentLevelIndex);

        // Debug tools - all disabled by default but can be toggled with controls
        this.showCollisions = false;

        // Listen for sequencer events
        EventBus.on("sequencer-started", this.onSequencerStarted, this);
        EventBus.on("sequencer-stopped", this.onSequencerStopped, this);
        EventBus.on("sequencer-step", this.onSequencerStep, this);
        EventBus.on("game-time-up", this.onGameTimeUp, this);
        EventBus.on("game-reset", this.onGameReset, this);

        // Listen for debug toggle events
        EventBus.on("toggle-grid", this.onToggleGrid, this);
        EventBus.on("toggle-collisions", this.onToggleCollisions, this);
        EventBus.on("switch-level", this.onSwitchLevel, this);
        EventBus.on("request-current-level", this.onRequestCurrentLevel, this);

        EventBus.emit("current-scene-ready", this);
    }

    /**
     * Load and initialize a specific level
     * @param {number} levelIndex - Index of the level to load
     */
    loadLevel(levelIndex) {
        console.log(`Loading level ${levelIndex + 1}...`);

        // Clean up current level
        if (this.currentLevel) {
            this.currentLevel.destroy();
        }

        // Clear platforms group
        this.platforms.clear(true, true);

        // Create new level instance
        const LevelClass = this.availableLevels[levelIndex];
        this.currentLevel = new LevelClass(this);

        // Create the level content
        this.currentLevel.create();

        // Get level-specific configuration
        const instrumentConfig = this.currentLevel.getInstrumentConfig();
        const measureCount = this.currentLevel.getMeasureCount();
        const maxLoops = this.currentLevel.getMaxLoops();

        // Emit level change event for UI updates
        EventBus.emit("level-changed", {
            levelIndex: levelIndex,
            levelNumber: levelIndex + 1,
            levelName: `Level ${levelIndex + 1}`,
            instrumentConfig: instrumentConfig,
            measureCount: measureCount,
            maxLoops: maxLoops,
        });

        console.log(`Level ${levelIndex + 1} loaded successfully`);
    }

    /**
     * Switch to the next level (for debugging)
     */
    switchToNextLevel() {
        this.currentLevelIndex =
            (this.currentLevelIndex + 1) % this.availableLevels.length;
        this.loadLevel(this.currentLevelIndex);

        // Reset game state when switching levels
        this.onGameReset();

        // Get level-specific configuration for the event
        const instrumentConfig = this.currentLevel.getInstrumentConfig();
        const measureCount = this.currentLevel.getMeasureCount();
        const maxLoops = this.currentLevel.getMaxLoops();

        // Emit level change event for UI updates
        EventBus.emit("level-changed", {
            levelIndex: this.currentLevelIndex,
            levelNumber: this.currentLevelIndex + 1,
            levelName: `Level ${this.currentLevelIndex + 1}`,
            instrumentConfig: instrumentConfig,
            measureCount: measureCount,
            maxLoops: maxLoops,
        });

        console.log(`Switched to Level ${this.currentLevelIndex + 1}`);
    }

    onSequencerStarted(data) {
        console.log("Sequencer started with data:", data);

        // Reset moving objects to initial positions
        this.resetMovingObjectsToInitialPositions();

        // Enter sequencer mode and reset game state
        this.isSequencerMode = true;
        this.sequencerData = data;
        this.currentLoop = 0;
        this.isGameOver = false;
        this.maxLoops = data.maxLoops || 2;

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
            data.activeBeats,
            "Loop:",
            data.currentLoop
        );

        // Only process if we're in sequencer mode and player exists
        if (
            !this.isSequencerMode ||
            !this.currentLevel ||
            !this.currentLevel.player
        )
            return;

        // Update current loop state
        this.currentLoop = data.currentLoop || 0;
        this.isGameOver = data.isGameOver || false;

        // Don't process movement if game is over
        if (this.isGameOver) return;

        const { activeBeats } = data;

        // Use the player's sequencer movement handler
        this.currentLevel.player.handleSequencerMovement(activeBeats);
    }

    onGameTimeUp() {
        console.log("Game time is up! Player failed to win in time.");
        this.isGameOver = true;

        // Show game over message
        this.showGameOverMessage();
    }

    onGameReset() {
        console.log("Game reset requested");

        // Reset moving objects to initial positions
        this.resetMovingObjectsToInitialPositions();

        // Clear any game over messages
        if (this.gameOverText) {
            this.gameOverText.destroy();
            this.gameOverText = null;
        }

        // Reset game state
        this.currentLoop = 0;
        this.isGameOver = false;
        this.isSequencerMode = false;
        this.sequencerData = null;
    }

    showGameOverMessage() {
        // Create game over text
        const gameOverText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            "TIME'S UP!\nGame will restart...",
            {
                fontSize: "48px",
                fontFamily: "Arial",
                color: "#ff4444",
                stroke: "#000000",
                strokeThickness: 4,
                align: "center",
            }
        );

        // Center the text
        gameOverText.setOrigin(0.5);

        // Make sure it's always visible (fixed to camera)
        gameOverText.setScrollFactor(0);

        // Store reference for cleanup
        this.gameOverText = gameOverText;

        // Add pulsing effect
        this.tweens.add({
            targets: gameOverText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        console.log("Game over message displayed");
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

    onSwitchLevel() {
        this.switchToNextLevel();
    }

    onRequestCurrentLevel() {
        // Send current level info when requested
        if (this.currentLevel) {
            const instrumentConfig = this.currentLevel.getInstrumentConfig();
            const measureCount = this.currentLevel.getMeasureCount();
            const maxLoops = this.currentLevel.getMaxLoops();
            EventBus.emit("level-changed", {
                levelIndex: this.currentLevelIndex,
                levelNumber: this.currentLevelIndex + 1,
                levelName: `Level ${this.currentLevelIndex + 1}`,
                instrumentConfig: instrumentConfig,
                measureCount: measureCount,
                maxLoops: maxLoops,
            });
        }
    }

    update() {
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

        // Update current level (handles player and all level objects)
        if (this.currentLevel) {
            this.currentLevel.update();

            // Update player specifically (if it exists)
            if (this.currentLevel.player) {
                this.currentLevel.player.update();
            }
        }
    }

    // Clean up event listeners when scene is destroyed
    destroy() {
        // Clean up current level
        if (this.currentLevel) {
            this.currentLevel.destroy();
            this.currentLevel = null;
        }

        EventBus.off("sequencer-started", this.onSequencerStarted, this);
        EventBus.off("sequencer-stopped", this.onSequencerStopped, this);
        EventBus.off("sequencer-step", this.onSequencerStep, this);
        EventBus.off("game-time-up", this.onGameTimeUp, this);
        EventBus.off("game-reset", this.onGameReset, this);
        EventBus.off("toggle-grid", this.onToggleGrid, this);
        EventBus.off("toggle-collisions", this.onToggleCollisions, this);
        EventBus.off("switch-level", this.onSwitchLevel, this);
        super.destroy();
    }
}

