<script setup>
import { ref } from "vue";
import PhaserGame from "./PhaserGame.vue";
import DrumSequencer from "./DrumSequencer.vue";

//  References to the PhaserGame component (game and scene are exposed)
const phaserRef = ref();
</script>

<template>
    <div class="app-container">
        <div class="game-section">
            <PhaserGame ref="phaserRef" />
        </div>
        <div class="ui-section">
            <DrumSequencer title="Level 1" />
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
