import { Game } from "./scenes/Game";
import Phaser from "phaser";
import { Preloader } from "./scenes/Preloader";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const getGameDimensions = () => {
    // Get the viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Game container takes up the top 50% of the screen
    const containerHeight = viewportHeight * 0.5;

    // Use full available space without maintaining aspect ratio
    let gameWidth = viewportWidth;
    let gameHeight = containerHeight;

    // Set reasonable minimums as percentage of viewport
    gameWidth = Math.max(320, gameWidth);
    gameHeight = Math.max(240, gameHeight);

    return { width: gameWidth, height: gameHeight };
};

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: "#87CEEB",
    scene: [Preloader, Game],
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 },
            debug: import.meta.env.DEV,
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

const StartGame = (parent) => {
    const dimensions = getGameDimensions();
    return new Phaser.Game({
        ...config,
        parent,
        width: dimensions.width,
        height: dimensions.height,
    });
};

export default StartGame;
