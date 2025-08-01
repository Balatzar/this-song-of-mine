<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { EventBus } from "./game/EventBus";
import StartGame from "./game/main";

// Save the current scene instance
const scene = ref();
const game = ref();

// Debug toggle states - disabled by default
const showGrid = ref(false);
const showCollisions = ref(false);

const emit = defineEmits(["current-active-scene"]);

// Toggle functions
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

onMounted(() => {
    game.value = StartGame("game-container");

    EventBus.on("current-scene-ready", (currentScene) => {
        emit("current-active-scene", currentScene);

        scene.value = currentScene;
    });
});

onUnmounted(() => {
    if (game.value) {
        game.value.destroy(true);
        game.value = null;
    }
});

defineExpose({ scene, game });
</script>

<template>
    <div class="game-wrapper">
        <div id="game-container"></div>
        <div class="floating-buttons">
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
</style>
