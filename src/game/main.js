import { Boot } from "./scenes/Boot";
import { Game } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
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

    // Set reasonable minimums only
    gameWidth = Math.max(400, gameWidth);
    gameHeight = Math.max(300, gameHeight);

    return { width: gameWidth, height: gameHeight };
};

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: "#028af8",
    scene: [Boot, Preloader, MainMenu, Game, GameOver],
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
