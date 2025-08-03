<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { EventBus } from "./game/EventBus";
import StartGame from "./game/main";

// Save the current scene instance
const scene = ref();
const game = ref();

// Debug toggle states - disabled by default, only available in dev mode
const isDevMode = import.meta.env.DEV;
const showGrid = ref(false);
const showCollisions = ref(false);
const selectedLevel = ref(0);

const emit = defineEmits(["current-active-scene"]);

// Debug functions
const toggleGrid = () => {
    showGrid.value = !showGrid.value;
    if (scene.value) {
        EventBus.emit("toggle-grid", showGrid.value);
    }
};

const toggleCollisions = () => {
    showCollisions.value = !showCollisions.value;
    if (scene.value) {
        EventBus.emit("toggle-collisions", showCollisions.value);
    }
};

const loadLevel = () => {
    if (scene.value) {
        EventBus.emit("load-specific-level", parseInt(selectedLevel.value));
    }
};

onMounted(() => {
    game.value = StartGame("game-container");

    EventBus.on("current-scene-ready", (currentScene) => {
        emit("current-active-scene", currentScene);

        scene.value = currentScene;
    });

    // Listen for level changes to keep dropdown in sync
    EventBus.on("level-changed", (levelData) => {
        selectedLevel.value = levelData.levelIndex;
    });
});

onUnmounted(() => {
    if (game.value) {
        game.value.destroy(true);
        game.value = null;
    }

    // Clean up event listeners
    EventBus.off("level-changed");
});

defineExpose({ scene, game });
</script>

<template>
    <div class="game-wrapper">
        <div id="game-container"></div>
        <div v-if="isDevMode" class="floating-buttons">
            <button
                @click="toggleGrid"
                :class="['debug-button', { active: showGrid }]"
                title="Toggle Grid"
            >
                📏
            </button>
            <button
                @click="toggleCollisions"
                :class="['debug-button', { active: showCollisions }]"
                title="Toggle Collision Zones"
            >
                🔲
            </button>
            <div class="level-selector">
                <select
                    v-model="selectedLevel"
                    @change="loadLevel"
                    class="level-dropdown"
                >
                    <option value="0">Level 1</option>
                    <option value="1">Level 2</option>
                    <option value="2">Level 3</option>
                    <option value="3">Level 4</option>
                    <option value="4">Level 5</option>
                    <option value="5">Level 6</option>
                    <option value="6">Level 7</option>
                    <option value="7">Level 8</option>
                    <option value="8">Level 9</option>
                    <option value="9">Level 10</option>
                    <option value="10">Level 11</option>
                </select>
            </div>
        </div>
    </div>
</template>

<style scoped>
.game-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

#game-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.floating-buttons {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1000;
}

.debug-button {
    width: 50px;
    height: 50px;
    border: 2px solid #333;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.debug-button:hover {
    background: rgba(64, 64, 64, 0.9);
    border-color: #666;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.debug-button.active {
    background: rgba(0, 100, 200, 0.8);
    border-color: #0064c8;
    color: #fff;
}

.debug-button.active:hover {
    background: rgba(0, 120, 240, 0.9);
    border-color: #0078f0;
}

.level-selector {
    margin-bottom: 10px;
}

.level-dropdown {
    width: 100px;
    height: 40px;
    border: 2px solid #333;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    padding: 0 10px;
    text-align: center;
}

.level-dropdown:hover {
    background: rgba(64, 64, 64, 0.9);
    border-color: #666;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.level-dropdown:focus {
    outline: none;
    background: rgba(0, 100, 200, 0.8);
    border-color: #0064c8;
}

.level-dropdown option {
    background: #333;
    color: #fff;
    padding: 5px;
}
</style>
