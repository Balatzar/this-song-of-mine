<script setup>
import { ref, onUnmounted, onMounted } from "vue";
import { EventBus } from "./game/EventBus";

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
const bpm = ref(80);
const steps = 16;

// Drawing State
const isDrawing = ref(false);
const hasMoved = ref(false); // Track if mouse moved during draw
const drawingMode = ref(null); // 'activate' or 'deactivate'
const initialStep = ref({ trackIndex: null, stepIndex: null }); // Track initial step for single click

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
        intervalId = null; // Reset intervalId to null
        isPlaying.value = false;
        // Stop the sequence in the game
        EventBus.emit("sequencer-stopped");
    } else {
        isPlaying.value = true;
        // Send sequence data to the game (this will trigger scene restart)
        EventBus.emit("sequencer-started", {
            tracks: tracks.value,
            bpm: bpm.value,
            steps: steps,
        });
        // Don't call play() immediately - wait for scene to be ready
        // The game scene will emit "sequencer-ready-to-play" when ready
    }
};

const stop = () => {
    clearInterval(intervalId);
    intervalId = null; // Reset intervalId to null
    isPlaying.value = false;
    currentStep.value = 0;
    // Stop the sequence in the game
    EventBus.emit("sequencer-stopped");
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

        // Send current step to game
        EventBus.emit("sequencer-step", {
            currentStep: currentStep.value,
            activeBeats: tracks.value.map(
                (track) => track.pattern[currentStep.value]
            ),
        });

        // Move to next step
        currentStep.value = (currentStep.value + 1) % steps;
    }, stepTime);
};

const toggleStep = (trackIndex, stepIndex) => {
    // Prevent modifications while playing
    if (isPlaying.value) return;

    tracks.value[trackIndex].pattern[stepIndex] =
        !tracks.value[trackIndex].pattern[stepIndex];
};

// Drawing Functions
const startDrawing = (trackIndex, stepIndex, event) => {
    // Prevent modifications while playing
    if (isPlaying.value) return;

    event.preventDefault();
    isDrawing.value = true;
    hasMoved.value = false;

    // Store initial step
    initialStep.value = { trackIndex, stepIndex };

    // Determine drawing mode based on current step state
    const currentState = tracks.value[trackIndex].pattern[stepIndex];
    drawingMode.value = currentState ? "deactivate" : "activate";

    // Don't apply immediately - wait for mouseup or movement
};

const continueDrawing = (trackIndex, stepIndex) => {
    if (isDrawing.value) {
        if (!hasMoved.value) {
            // First movement - apply to initial step too
            applyDrawing(
                initialStep.value.trackIndex,
                initialStep.value.stepIndex
            );
            hasMoved.value = true;
        }
        applyDrawing(trackIndex, stepIndex);
    }
};

const stopDrawing = (trackIndex, stepIndex) => {
    if (isDrawing.value && !hasMoved.value) {
        // This was a single click, not a drag - use normal toggle behavior
        toggleStep(initialStep.value.trackIndex, initialStep.value.stepIndex);
    }

    isDrawing.value = false;
    hasMoved.value = false;
    drawingMode.value = null;
    initialStep.value = { trackIndex: null, stepIndex: null };
};

const applyDrawing = (trackIndex, stepIndex) => {
    if (drawingMode.value === "activate") {
        tracks.value[trackIndex].pattern[stepIndex] = true;
    } else if (drawingMode.value === "deactivate") {
        tracks.value[trackIndex].pattern[stepIndex] = false;
    }
};

const clearPattern = () => {
    // Prevent modifications while playing
    if (isPlaying.value) return;

    tracks.value.forEach((track) => {
        track.pattern.fill(false);
    });
};

const createDebugPattern = () => {
    // Prevent modifications while playing
    if (isPlaying.value) return;

    // Create a simple but musically useful drum pattern for testing
    const patterns = {
        Kick: [
            false,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
        ],
        Snare: [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
        ],
        "Hi-Hat": [
            true,
            true,
            true,
            true,
            false,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
        ],
        "Open Hat": [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
        ],
    };

    tracks.value.forEach((track) => {
        if (patterns[track.name]) {
            track.pattern = [...patterns[track.name]];
        }
    });
};

// Listen for game scene ready signal
EventBus.on("sequencer-ready-to-play", () => {
    console.log("Received sequencer-ready-to-play signal", {
        isPlaying: isPlaying.value,
        intervalId: intervalId,
        shouldStart: isPlaying.value && !intervalId,
    });

    // Only start playing if we're in the "waiting to play" state
    if (isPlaying.value && !intervalId) {
        console.log("Scene ready - starting sequencer playback");
        play();
    } else {
        console.log("Not starting playback - conditions not met");
    }
});

// Global mouse up handler for drawing
const globalStopDrawing = () => {
    if (isDrawing.value && !hasMoved.value) {
        // This was a single click, not a drag - use normal toggle behavior
        toggleStep(initialStep.value.trackIndex, initialStep.value.stepIndex);
    }

    isDrawing.value = false;
    hasMoved.value = false;
    drawingMode.value = null;
    initialStep.value = { trackIndex: null, stepIndex: null };
};

// Setup global mouse events for drawing
onMounted(() => {
    document.addEventListener("mouseup", globalStopDrawing);
    document.addEventListener("mouseleave", globalStopDrawing);
});

// Cleanup
onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    // Clean up event listeners
    EventBus.off("sequencer-ready-to-play");
    document.removeEventListener("mouseup", globalStopDrawing);
    document.removeEventListener("mouseleave", globalStopDrawing);
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
            <button
                class="control-btn"
                @click="clearPattern"
                :disabled="isPlaying"
                :class="{ disabled: isPlaying }"
            >
                Clear
            </button>
            <button
                class="control-btn debug-btn"
                @click="createDebugPattern"
                :disabled="isPlaying"
                :class="{ disabled: isPlaying }"
                title="Create debug pattern"
            >
                🥁
            </button>

            <div class="bpm-control">
                <label>BPM:</label>
                <span class="bpm-display">{{ bpm }}</span>
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
                            drawing: isDrawing,
                            disabled: isPlaying,
                        }"
                        :style="{
                            backgroundColor: step ? track.color : '',
                            opacity:
                                currentStep === stepIndex && isPlaying
                                    ? 0.8
                                    : 1,
                        }"
                        @mousedown="startDrawing(trackIndex, stepIndex, $event)"
                        @mouseenter="continueDrawing(trackIndex, stepIndex)"
                        @mouseup="stopDrawing(trackIndex, stepIndex)"
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
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
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

.control-btn.debug-btn {
    background: #ff9800;
    color: white;
}

.control-btn.debug-btn:hover {
    background: #ff6f00;
    transform: translateY(-1px);
}

.control-btn.disabled {
    background: #666;
    color: #999;
    cursor: not-allowed;
    opacity: 0.5;
}

.control-btn.disabled:hover {
    background: #666;
    transform: none;
}

.bpm-control {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 15px;
    border-radius: 6px;
}

.bpm-control .bpm-display {
    min-width: 40px;
    font-weight: bold;
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    text-align: center;
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

.step-btn.drawing {
    cursor: crosshair;
    border-color: #aaa;
}

.step-btn.drawing:hover {
    border-color: #fff;
    transform: scale(1.1);
}

.step-btn.disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.step-btn.disabled:hover {
    border-color: #555;
    transform: none;
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

