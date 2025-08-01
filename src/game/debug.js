/**
 * Debug utilities for game development
 */

export class DebugTools {
    /**
     * Creates a grid overlay with coordinate labels for easier block placement
     * @param {Phaser.Scene} scene - The Phaser scene to add the grid to
     * @param {number} gridSize - The size of each grid cell (default: 64px)
     */
    static createGridOverlay(scene, gridSize = 64) {
        const gameWidth = scene.sys.game.config.width;
        const gameHeight = scene.sys.game.config.height;

        // Create graphics object for drawing grid lines
        const graphics = scene.add.graphics();
        graphics.lineStyle(1, 0x00ff00, 0.5); // Green lines with 50% opacity

        // Draw vertical lines
        for (let x = 0; x <= gameWidth; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, gameHeight);
        }

        // Draw horizontal lines
        for (let y = 0; y <= gameHeight; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(gameWidth, y);
        }

        graphics.strokePath();

        // Add coordinate labels at intersections
        for (let x = 0; x <= gameWidth; x += gridSize) {
            for (let y = 0; y <= gameHeight; y += gridSize) {
                // Create text showing grid coordinates
                const coordinateText = scene.add.text(
                    x + 2,
                    y + 2,
                    `${x},${y}`,
                    {
                        fontSize: "10px",
                        fill: "#00ff00",
                        backgroundColor: "#000000",
                        alpha: 0.7,
                    }
                );
                coordinateText.setDepth(1000); // Make sure coordinates appear above everything
            }
        }

        // Set grid depth to be above game elements but below UI
        graphics.setDepth(999);

        return graphics;
    }

    /**
     * Shows collision zones for all physics-enabled objects
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {Object} options - Configuration options
     */
    static showCollisionZones(scene, options = {}) {
        const config = {
            enabled: true,
            lineColor: 0xff0000,
            lineAlpha: 0.8,
            fillColor: 0xff0000,
            fillAlpha: 0.2,
            lineWidth: 2,
            ...options,
        };

        if (!config.enabled) return;

        // Create graphics object for collision visualization
        if (!scene.collisionDebugGraphics) {
            scene.collisionDebugGraphics = scene.add.graphics();
            scene.collisionDebugGraphics.setDepth(1001);
        }

        // Clear previous drawings
        scene.collisionDebugGraphics.clear();

        // Set line and fill styles
        scene.collisionDebugGraphics.lineStyle(
            config.lineWidth,
            config.lineColor,
            config.lineAlpha
        );
        scene.collisionDebugGraphics.fillStyle(
            config.fillColor,
            config.fillAlpha
        );

        // Draw collision zones for all physics bodies
        scene.physics.world.bodies.entries.forEach((body) => {
            if (body.enable) {
                // Draw collision rectangle
                scene.collisionDebugGraphics.strokeRect(
                    body.x,
                    body.y,
                    body.width,
                    body.height
                );

                // Optional: fill the collision zone
                scene.collisionDebugGraphics.fillRect(
                    body.x,
                    body.y,
                    body.width,
                    body.height
                );
            }
        });

        return scene.collisionDebugGraphics;
    }

    /**
     * Toggles collision zone visibility
     * @param {Phaser.Scene} scene - The Phaser scene
     */
    static toggleCollisionZones(scene) {
        if (scene.collisionDebugGraphics) {
            scene.collisionDebugGraphics.visible =
                !scene.collisionDebugGraphics.visible;
        }
    }

    /**
     * Creates a debug info panel showing physics body information
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {Phaser.Physics.Arcade.Body} body - The physics body to monitor
     * @param {string} label - Label for the debug info
     */
    static createBodyDebugInfo(scene, body, label = "Body") {
        const debugText = scene.add.text(10, 10, "", {
            fontSize: "12px",
            fill: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 5, y: 5 },
        });
        debugText.setDepth(1002);

        // Update function to show body info
        const updateDebugInfo = () => {
            if (body && body.enable) {
                debugText.setText(
                    `${label} Debug:\n` +
                        `Position: (${Math.round(body.x)}, ${Math.round(
                            body.y
                        )})\n` +
                        `Size: ${body.width} x ${body.height}\n` +
                        `Velocity: (${Math.round(
                            body.velocity.x
                        )}, ${Math.round(body.velocity.y)})\n` +
                        `Touching: Down=${body.touching.down} Up=${body.touching.up} Left=${body.touching.left} Right=${body.touching.right}`
                );
            }
        };

        // Add to scene's update loop
        scene.events.on("preupdate", updateDebugInfo);

        return debugText;
    }
}

