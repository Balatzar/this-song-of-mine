import { BaseLevel } from "./BaseLevel";
import { Player } from "../objects/Player";
import { ExitSign } from "../objects/ExitSign";
import { Drummy } from "../objects/Drummy";
import { Bridge } from "../objects/Bridge";
import { Snail } from "../objects/Snail";

/**
 * Level 9 - Test level for forced beats feature
 * Certain beats are always present in the sequencer
 */
export class Level9 extends BaseLevel {
    constructor(scene) {
        super(scene);
    }

    getPlayerStartPosition() {
        return { x: 200, y: null };
    }

    getInstrumentConfig() {
        return {
            availableInstruments: ["Kick", "Snare", "Hi-Hat", "Clap"],
            budgetConfig: {
                Kick: { max: 6, unlimited: false },
                Snare: { max: 4, unlimited: false },
                "Hi-Hat": { max: 0, unlimited: true },
                Clap: { max: 0, unlimited: true },
            },
        };
    }

    getMeasureCount() {
        return 4;
    }

    getMaxLoops() {
        return 2;
    }

    getForcedBeats() {
        // These beats will always be present in the sequencer
        return {
            Kick: [0, 8], // Forced kick on beats 1 and 9 (strong beats)
            Snare: [4, 12], // Forced snare on beats 5 and 13 (backbeats)
            "Hi-Hat": [2, 10, 14], // Forced hi-hat on offbeats
            Clap: [7, 15], // Forced clap on syncopated beats
        };
    }

    getDebugPattern() {
        // Pattern that includes the forced beats and some additional ones
        return {
            Kick: [
                false,
                false,
                false,
                true,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
            ],
            Snare: [
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
            ],
            "Hi-Hat": [
                true,
                true,
                true,
                true,
                true,
                false,
                false,
                false,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
            ],
            Clap: [
                false,
                false,
                false,
                false,
                false,
                true,
                true,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
            ],
        };
    }

    create() {
        console.log("Creating Level 9 - Forced Beats Test...");

        // Create extended floor
        const worldWidth = this.scene.physics.world.bounds.width;
        const blocksPerRow = Math.ceil(worldWidth / this.scene.blockSize);
        for (let x = 0; x < blocksPerRow; x++) {
            this.createBlockAt(x, 0, "dirt_block");
        }

        // Create player at the starting position
        const startPos = this.getPlayerStartPosition();
        this.player = new Player(
            this.scene,
            this.scene.platforms,
            startPos.x,
            startPos.y
        );

        this.createWall(9, 1, 9, 5, "bricks_brown");

        const bridge1 = new Bridge(this.scene, 8, 2, 0, 20, this.player);
        this.addLevelObject(bridge1);

        this.createWall(4, 4, 4, 15, "bricks_brown");

        const bridge2 = new Bridge(this.scene, 5, 4, 0, 30, this.player);
        this.addLevelObject(bridge2);

        const bridge3 = new Bridge(this.scene, 8, 5, 0, 0, this.player);
        this.addLevelObject(bridge3);

        this.createWall(10, 5, 15, 5, "bricks_brown");

        const snail1 = new Snail(this.scene, 12, 6, 0, 0, this.player, 2 * 64);
        this.addEnemy(snail1);

        this.createWall(18, 10, 18, 4, "bricks_brown");

        const snail2 = new Snail(this.scene, 12, 1, 0, 0, this.player, 2 * 64);
        this.addEnemy(snail2);

        const exitSign = new ExitSign(this.scene, 22, 1, 0, 0, this.player);
        this.addLevelObject(exitSign);
    }
}

