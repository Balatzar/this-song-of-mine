import { Scene } from "phaser";

// Import asset URLs
import characterIdleUrl from "../../assets/Sprites/Characters/Default/character_green_idle.png?url";
import characterWalkAUrl from "../../assets/Sprites/Characters/Default/character_green_walk_a.png?url";
import characterWalkBUrl from "../../assets/Sprites/Characters/Default/character_green_walk_b.png?url";
import characterJumpUrl from "../../assets/Sprites/Characters/Default/character_green_jump.png?url";
import dirtBlockUrl from "../../assets/Sprites/Tiles/Default/terrain_grass_block_top.png?url";
import signExitUrl from "../../assets/Sprites/Tiles/Default/sign_exit.png?url";
import bridgeLogsUrl from "../../assets/Sprites/Tiles/Default/bridge_logs.png?url";
import bridgeUrl from "../../assets/Sprites/Tiles/Default/bridge.png?url";
import bricksBrownUrl from "../../assets/Sprites/Tiles/Default/bricks_brown.png?url";
import snailWalkAUrl from "../../assets/Sprites/Enemies/Default/snail_walk_a.png?url";
import drumCrawlAUrl from "../../assets/Sprites/Enemies/Default/drum_crawl_a.png?url";
import drumCrawlBUrl from "../../assets/Sprites/Enemies/Default/drum_crawl_b.png?url";
import drumRestUrl from "../../assets/Sprites/Enemies/Default/drum_rest.png?url";
import drumHurteUrl from "../../assets/Sprites/Enemies/Default/drum_hurt.png?url";
import sawRestUrl from "../../assets/Sprites/Enemies/Default/saw_rest.png?url";
import sawAUrl from "../../assets/Sprites/Enemies/Default/saw_a.png?url";
import sawBUrl from "../../assets/Sprites/Enemies/Default/saw_b.png?url";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {}

    preload() {
        //  Load the assets for the game using imported URLs
        // Load character sprites
        this.load.image("character_idle", characterIdleUrl);
        this.load.image("character_walk_a", characterWalkAUrl);
        this.load.image("character_walk_b", characterWalkBUrl);
        this.load.image("character_jump", characterJumpUrl);

        // Load terrain sprites
        this.load.image("dirt_block", dirtBlockUrl);
        this.load.image("bricks_brown", bricksBrownUrl);
        this.load.image("sign_exit", signExitUrl);
        this.load.image("bridge_logs", bridgeLogsUrl);
        this.load.image("bridge", bridgeUrl);

        // Load enemy sprites
        this.load.image("snail_walk_a", snailWalkAUrl);
        this.load.image("drum_crawl_a", drumCrawlAUrl);
        this.load.image("drum_crawl_b", drumCrawlBUrl);
        this.load.image("drum_rest", drumRestUrl);
        this.load.image("drum_hurt", drumHurteUrl);
        this.load.image("saw_rest", sawRestUrl);
        this.load.image("saw_a", sawAUrl);
        this.load.image("saw_b", sawBUrl);
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        // Create drum crawling animation
        this.anims.create({
            key: "drum_crawl",
            frames: [{ key: "drum_crawl_a" }, { key: "drum_crawl_b" }],
            frameRate: 4, // Slow animation for crawling effect
            repeat: -1, // Loop forever
        });

        // Create saw spinning animation
        this.anims.create({
            key: "saw_spin",
            frames: [{ key: "saw_a" }, { key: "saw_b" }],
            frameRate: 8, // Fast animation for spinning effect
            repeat: -1, // Loop forever
        });

        //  Move to the Game scene
        this.scene.start("Game");
    }
}

