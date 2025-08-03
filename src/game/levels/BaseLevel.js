/**
 * Base class for all game levels
 * Defines the interface that all levels must implement
 */
export class BaseLevel {
    constructor(scene) {
        this.scene = scene;
        this.player = null;
        this.enemies = [];
        this.levelObjects = [];
    }

    /**
     * Initialize the level - create all level-specific content
     * This method must be implemented by all level subclasses
     */
    create() {
        throw new Error("Level must implement create() method");
    }

    /**
     * Get the player starting position for this level
     * @returns {{x: number, y: number}} Player starting position in pixels
     */
    getPlayerStartPosition() {
        throw new Error("Level must implement getPlayerStartPosition() method");
    }

    /**
     * Get the instrument configuration for this level
     * Defines which instruments are available and their budget limits
     * @returns {Object} Instrument configuration with availability and budgets
     */
    getInstrumentConfig() {
        // Default configuration - all instruments available with basic budgets
        return {
            availableInstruments: ["Kick", "Snare", "Hi-Hat", "Open Hat"],
            budgetConfig: {
                Kick: { max: 4, unlimited: false },
                Snare: { max: 2, unlimited: false },
                "Hi-Hat": { max: 0, unlimited: true },
                "Open Hat": { max: 0, unlimited: true },
            },
        };
    }

    /**
     * Get the number of measures for this level
     * Each measure contains 4 beats, so total steps = measures * 4
     * @returns {number} Number of measures (default: 4)
     */
    getMeasureCount() {
        return 4; // Default 4 measures (16 steps)
    }

    /**
     * Get the maximum number of loops for this level
     * @returns {number} Maximum number of loops (default: 2)
     */
    getMaxLoops() {
        return 2; // Default 2 loops
    }

    /**
     * Get the debug pattern for this level
     * Returns a pattern object with each instrument's pattern array
     * @returns {Object} Debug pattern for development use
     */
    getDebugPattern() {
        return {};
    }

    /**
     * Update level-specific logic
     * Called every frame
     */
    update() {
        // Update all enemies
        this.enemies.forEach((enemy) => {
            if (enemy && enemy.update) {
                enemy.update();
            }
        });

        // Update all level objects
        this.levelObjects.forEach((obj) => {
            if (obj && obj.update) {
                obj.update();
            }
        });
    }

    /**
     * Reset all level objects to their initial state
     * Used when the sequencer starts/stops or game resets
     */
    resetToInitialState() {
        // Reset all enemies
        this.enemies.forEach((enemy) => {
            if (enemy && enemy.resetToInitialState) {
                enemy.resetToInitialState();
            }
        });

        // Reset all level objects
        this.levelObjects.forEach((obj) => {
            if (obj && obj.resetToInitialState) {
                obj.resetToInitialState();
            }
        });
    }

    /**
     * Clean up level resources
     */
    destroy() {
        // Destroy enemies
        this.enemies.forEach((enemy) => {
            if (enemy && enemy.destroy) {
                enemy.destroy();
            }
        });
        this.enemies = [];

        // Destroy level objects
        this.levelObjects.forEach((obj) => {
            if (obj && obj.destroy) {
                obj.destroy();
            }
        });
        this.levelObjects = [];

        // Destroy player if it exists
        if (this.player && this.player.destroy) {
            this.player.destroy();
        }
        this.player = null;
    }

    /**
     * Helper method to create a block at block coordinates
     * This uses the scene's createBlockAt method
     */
    createBlockAt(blockX, blockY, texture, offsetX = 0, offsetY = 0) {
        return this.scene.createBlockAt(
            blockX,
            blockY,
            texture,
            offsetX,
            offsetY
        );
    }
    createWall(fromBlockX, fromBlockY, toBlockX, toBlockY, texture) {
        return this.scene.createWall(
            fromBlockX,
            fromBlockY,
            toBlockX,
            toBlockY,
            texture
        );
    }

    /**
     * Add an enemy to this level
     */
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }

    /**
     * Add a level object to this level
     */
    addLevelObject(obj) {
        this.levelObjects.push(obj);
    }
}

