<script setup>
import { ref, onUnmounted } from "vue";

// Props
const props = defineProps({
    title: {
        type: String,
        default: "Drum Sequencer",
    },
});

// Drum Sequencer State
const isPlaying = ref(false);
const currentStep = ref(0);
const bpm = ref(120);
const steps = 16;

// Drum tracks
const tracks = ref([
    { name: "Kick", pattern: new Array(steps).fill(false), color: "#ff4444" },
    { name: "Snare", pattern: new Array(steps).fill(false), color: "#44ff44" },
    { name: "Hi-Hat", pattern: new Array(steps).fill(false), color: "#4444ff" },
    {
        name: "Open Hat",
        pattern: new Array(steps).fill(false),
        color: "#ffff44",
    },
]);

// Audio Context
let audioContext = null;
let intervalId = null;

// Simple drum sounds using oscillators
const createDrumSound = (type) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case "Kick":
            oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
                0.1,
                audioContext.currentTime + 0.5
            );
            gainNode.gain.setValueAtTime(1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.5
            );
            break;
        case "Snare":
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.2
            );
            break;
        case "Hi-Hat":
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.1
            );
            break;
        case "Open Hat":
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.3
            );
            break;
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
};

// Sequencer Controls
const initAudio = async () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === "suspended") {
        await audioContext.resume();
    }
};

const togglePlay = async () => {
    await initAudio();

    if (isPlaying.value) {
        clearInterval(intervalId);
        isPlaying.value = false;
    } else {
        isPlaying.value = true;
        play();
    }
};

const stop = () => {
    clearInterval(intervalId);
    isPlaying.value = false;
    currentStep.value = 0;
};

const play = () => {
    const stepTime = 60000 / (bpm.value * 4); // 16th notes
    console.log(tracks.value);

    intervalId = setInterval(() => {
        // Play sounds for current step
        tracks.value.forEach((track) => {
            if (track.pattern[currentStep.value]) {
                createDrumSound(track.name);
            }
        });

        // Move to next step
        currentStep.value = (currentStep.value + 1) % steps;
    }, stepTime);
};

const toggleStep = (trackIndex, stepIndex) => {
    tracks.value[trackIndex].pattern[stepIndex] =
        !tracks.value[trackIndex].pattern[stepIndex];
};

const clearPattern = () => {
    tracks.value.forEach((track) => {
        track.pattern.fill(false);
    });
};

// Cleanup
onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});
</script>

<template>
    <div class="sequencer-container">
        <h2>{{ title }}</h2>

        <!-- Controls -->
        <div class="controls">
            <button
                class="control-btn play-btn"
                @click="togglePlay"
                :class="{ active: isPlaying }"
            >
                {{ isPlaying ? "⏸️" : "▶️" }}
            </button>
            <button class="control-btn" @click="stop">⏹️</button>
            <button class="control-btn" @click="clearPattern">Clear</button>

            <div class="bpm-control">
                <label>BPM:</label>
                <input type="range" v-model="bpm" min="60" max="180" step="1" />
                <span>{{ bpm }}</span>
            </div>
        </div>

        <!-- Drum Grid -->
        <div class="drum-grid">
            <div
                v-for="(track, trackIndex) in tracks"
                :key="track.name"
                class="track-row"
            >
                <div class="track-label" :style="{ borderColor: track.color }">
                    {{ track.name }}
                </div>
                <div class="track-steps">
                    <button
                        v-for="(step, stepIndex) in track.pattern"
                        :key="stepIndex"
                        class="step-btn"
                        :class="{
                            active: step,
                            current: currentStep === stepIndex && isPlaying,
                        }"
                        :style="{
                            backgroundColor: step ? track.color : '',
                            opacity:
                                currentStep === stepIndex && isPlaying
                                    ? 0.8
                                    : 1,
                        }"
                        @click="toggleStep(trackIndex, stepIndex)"
                    ></button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Drum Sequencer Styles */
.sequencer-container {
    width: 100%;
    max-width: 900px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.sequencer-container h2 {
    text-align: center;
    margin: 0 0 20px 0;
    color: #fff;
    font-size: 24px;
}

.controls {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    justify-content: center;
    flex-wrap: wrap;
}

.control-btn {
    background: #444;
    border: none;
    color: white;
    padding: 10px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
    min-width: 50px;
}

.control-btn:hover {
    background: #555;
    transform: translateY(-1px);
}

.control-btn.active {
    background: #4caf50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
}

.bpm-control {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 15px;
    border-radius: 6px;
}

.bpm-control input[type="range"] {
    width: 100px;
}

.bpm-control span {
    min-width: 30px;
    font-weight: bold;
}

.drum-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
}

.track-row {
    display: flex;
    align-items: center;
    gap: 15px;
}

.track-label {
    width: 70px;
    padding: 8px;
    text-align: center;
    font-weight: bold;
    font-size: 12px;
    border: 2px solid;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

.track-steps {
    display: flex;
    gap: 3px;
    flex: 1;
    justify-content: center;
}

.step-btn {
    width: 30px;
    height: 30px;
    border: 1px solid #555;
    background: #333;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
}

/* Add gaps every 4 beats to indicate measures */
.step-btn:nth-child(4n) {
    margin-right: 12px;
}

.step-btn:hover {
    border-color: #777;
    transform: scale(1.05);
}

.step-btn.active {
    border-color: #fff;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.step-btn.current {
    animation: pulse 0.3s ease-in-out;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
}
</style>

