import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";

/**
 * Level 11 - Victory Screen
 * Final level that displays game credits and congratulations
 */
export class Level11 extends BaseLevel {
    constructor(scene) {
        super(scene);
        this.victoryText = null;
        this.creditsText = null;
    }

    getPlayerStartPosition() {
        return { x: 600, y: null }; // y will be calculated by Player class
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Hi-Hat", "Clap", "Crash"],
            budgetConfig: {
                Kick: { max: 0, unlimited: true },
                "Hi-Hat": { max: 0, unlimited: true },
                Clap: { max: 0, unlimited: true },
                Crash: { max: 0, unlimited: true },
            },
        };
    }

    getMeasureCount() {
        return 2;
    }

    getMaxLoops() {
        return 1;
    }

    getDebugPattern() {
        // Victory celebration pattern - a simple but satisfying rhythm
        return {
            Kick: [true, false, true, false, true, false, true, false],
            "Hi-Hat": [false, true, false, true, false, true, false, true],
            Clap: [false, false, true, false, false, false, true, false],
            Crash: [true, false, false, false, false, false, false, true],
        };
    }

    create() {
        console.log("Creating Level 11 - Victory Screen...");

        // Create extended floor - simple flat surface
        const worldWidth = this.scene.physics.world.bounds.width;
        const blocksPerRow = Math.ceil(worldWidth / this.scene.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player at the starting position
        const startPos = this.getPlayerStartPosition();
        this.player = new Player(this.scene, this.scene.platforms, startPos.x);

        // Create victory screen UI
        this.createVictoryScreen();

        console.log("Level 11 - Victory Screen created successfully");
    }

    createVictoryScreen() {
        const camera = this.scene.cameras.main;

        // Create a transparent dark background box
        const backgroundBox = this.scene.add.rectangle(
            camera.centerX,
            camera.centerY,
            800,
            500,
            0x000000,
            0.7
        );
        backgroundBox.setScrollFactor(0);

        // Main victory title
        this.victoryText = this.scene.add.text(
            camera.centerX,
            camera.centerY - 150,
            "CONGRATULATIONS!",
            {
                fontSize: "72px",
                fontFamily: "Arial",
                color: "#FFD700",
                stroke: "#000000",
                strokeThickness: 6,
                align: "center",
            }
        );
        this.victoryText.setOrigin(0.5);
        this.victoryText.setScrollFactor(0);

        // Subtitle
        const subtitleText = this.scene.add.text(
            camera.centerX,
            camera.centerY - 80,
            "You've completed all levels!",
            {
                fontSize: "36px",
                fontFamily: "Arial",
                color: "#FFFFFF",
                stroke: "#000000",
                strokeThickness: 3,
                align: "center",
            }
        );
        subtitleText.setOrigin(0.5);
        subtitleText.setScrollFactor(0);

        // Credits
        this.creditsText = this.scene.add.text(
            camera.centerX,
            camera.centerY + 50,
            "Game made by blatalzar\nArt by Kenney.nl and superbat3D\nIcons by Freepik.\nPlaytested by Mouchoir, Sanfé and superbat3D",
            {
                fontSize: "24px",
                fontFamily: "Arial",
                color: "#CCCCCC",
                stroke: "#000000",
                strokeThickness: 2,
                align: "center",
                lineSpacing: 10,
            }
        );
        this.creditsText.setOrigin(0.5);
        this.creditsText.setScrollFactor(0);

        // Thank you message
        const thankYouText = this.scene.add.text(
            camera.centerX,
            camera.centerY + 180,
            "Thank you for playing!",
            {
                fontSize: "28px",
                fontFamily: "Arial",
                color: "#90EE90",
                stroke: "#000000",
                strokeThickness: 3,
                align: "center",
            }
        );
        thankYouText.setOrigin(0.5);
        thankYouText.setScrollFactor(0);

        // Add pulsing animation to the main title
        this.scene.tweens.add({
            targets: this.victoryText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // Add floating animation to credits
        this.scene.tweens.add({
            targets: this.creditsText,
            y: camera.centerY + 40,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    destroy() {
        // Clean up victory screen elements
        if (this.victoryText) {
            this.victoryText.destroy();
            this.victoryText = null;
        }
        if (this.creditsText) {
            this.creditsText.destroy();
            this.creditsText = null;
        }

        // Call parent destroy
        super.destroy();
    }
}

