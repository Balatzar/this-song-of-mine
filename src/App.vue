<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import PhaserGame from "./PhaserGame.vue";
import DrumSequencer from "./DrumSequencer.vue";
import { EventBus } from "./game/EventBus";

//  References to the PhaserGame component (game and scene are exposed)
const phaserRef = ref();

// Level state for sequencer title
const currentLevelName = ref("Level 1");

// Event handlers
const handleLevelChanged = (levelData) => {
    currentLevelName.value = levelData.levelName;
};

onMounted(() => {
    EventBus.on("level-changed", handleLevelChanged);
});

onUnmounted(() => {
    EventBus.off("level-changed", handleLevelChanged);
});
</script>

<template>
    <div class="app-container">
        <div class="game-section">
            <PhaserGame ref="phaserRef" />
        </div>
        <div class="ui-section">
            <DrumSequencer :title="currentLevelName" />
        </div>
    </div>
</template>

<style scoped>
.app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
}

.game-section {
    flex: 1;
    height: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.ui-section {
    flex: 1;
    height: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
    color: white;
}
</style>
