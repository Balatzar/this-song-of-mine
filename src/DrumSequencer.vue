<script setup>
import { ref, onUnmounted, onMounted, computed } from "vue";
import { EventBus } from "./game/EventBus";

// Environment detection
const isDevelopment = import.meta.env.DEV;

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
const steps = ref(16); // Default 4 measures × 4 beats = 16 steps

// Loop limit system
const maxLoops = ref(2); // Default 2 loops
const currentLoop = ref(0);
const isGameOver = ref(false);

// Drawing State
const isDrawing = ref(false);
const hasMoved = ref(false); // Track if mouse moved during draw
const drawingMode = ref(null); // 'activate' or 'deactivate'
const initialStep = ref({ trackIndex: null, stepIndex: null }); // Track initial step for single click

// Level-specific instrument configuration
const currentLevelConfig = ref({
    availableInstruments: ["Kick", "Snare", "Hi-Hat", "Open Hat"],
    budgetConfig: {
        Kick: { max: 4, unlimited: false },
        Snare: { max: 2, unlimited: false },
        "Hi-Hat": { max: 0, unlimited: true },
        "Open Hat": { max: 0, unlimited: true },
    },
});

// Current level index for display
const currentLevelIndex = ref(0);

// Current budget configuration (updated by level)
const budgetConfig = ref({
    Kick: { max: 4, unlimited: false },
    Snare: { max: 2, unlimited: false },
    "Hi-Hat": { max: 0, unlimited: true },
    "Open Hat": { max: 0, unlimited: true },
});

// Budget tracking
const budgetUsage = ref({
    Kick: 0,
    Snare: 0,
    "Hi-Hat": 0,
    "Open Hat": 0,
});

// Drum tracks
const tracks = ref([
    {
        name: "Kick",
        ability: "Jump",
        icon: "src/assets/Icons/kick.png",
        pattern: new Array(steps.value).fill(false),
        color: "#ff4444",
    },
    {
        name: "Snare",
        ability: "Dash after jump",
        icon: "src/assets/Icons/snare.png",
        pattern: new Array(steps.value).fill(false),
        color: "#44ff44",
    },
    {
        name: "Hi-Hat",
        ability: "Go Right",
        icon: "src/assets/Icons/hi-hat.png",
        pattern: new Array(steps.value).fill(false),
        color: "#4444ff",
    },
    {
        name: "Open Hat",
        ability: "Go Left",
        icon: "src/assets/Icons/hi-hat-open.png",
        pattern: new Array(steps.value).fill(false),
        color: "#ffff44",
    },
]);

// Audio Context
let audioContext = null;
let intervalId = null;

// Frame-based timing for consistent playback
let animationFrameId = null;
let lastStepTime = 0;
let nextStepTime = 0;

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

// Budget Management Functions
const countBeats = (trackName) => {
    const track = tracks.value.find((t) => t.name === trackName);
    return track ? track.pattern.filter((step) => step).length : 0;
};

const updateBudgetUsage = () => {
    tracks.value.forEach((track) => {
        budgetUsage.value[track.name] = countBeats(track.name);
    });
};

const canAddBeat = (trackName) => {
    if (!budgetConfig.value) return false; // No config available yet
    const config = budgetConfig.value[trackName];
    if (!config) return false; // Instrument not available in current level
    if (config.unlimited) return true;

    const currentUsage = countBeats(trackName);
    return currentUsage < config.max;
};

const isBudgetExceeded = (trackName) => {
    if (!budgetConfig.value) return false; // No config available yet
    const config = budgetConfig.value[trackName];
    if (!config) return true; // Instrument not available in current level
    if (config.unlimited) return false;

    const currentUsage = countBeats(trackName);
    return currentUsage >= config.max;
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

const togglePlayStop = async () => {
    await initAudio();

    if (isPlaying.value) {
        // Currently playing - stop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        clearInterval(intervalId);
        intervalId = null;
        isPlaying.value = false;
        // Stop the sequence in the game
        EventBus.emit("sequencer-stopped");
    } else {
        // Currently stopped - start playing
        currentLoop.value = 0;
        isGameOver.value = false;

        isPlaying.value = true;
        // Send sequence data to the game (this will trigger scene restart)
        EventBus.emit("sequencer-started", {
            tracks: tracks.value,
            bpm: bpm.value,
            steps: steps.value,
            maxLoops: maxLoops.value,
        });
        // Don't call play() immediately - wait for scene to be ready
        // The game scene will emit "sequencer-ready-to-play" when ready
    }
};

const stop = () => {
    // Cancel animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    clearInterval(intervalId);
    intervalId = null; // Reset intervalId to null
    isPlaying.value = false;
    currentStep.value = 0;
    // Stop the sequence in the game
    EventBus.emit("sequencer-stopped");
};

const resetGame = () => {
    stop();
    currentLoop.value = 0;
    isGameOver.value = false;
    EventBus.emit("game-reset");
};

const play = () => {
    const stepTime = 60000 / (bpm.value * 4); // 16th notes in milliseconds
    console.log(tracks.value);

    // Initialize timing for frame-based sequencer
    lastStepTime = performance.now();
    nextStepTime = lastStepTime + stepTime;

    const tick = (currentTime) => {
        // Skip processing if game is over
        if (isGameOver.value) {
            return;
        }

        // Check if it's time for the next step
        if (currentTime >= nextStepTime) {
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
                currentLoop: currentLoop.value,
                maxLoops: maxLoops.value,
                isGameOver: isGameOver.value,
            });

            // Move to next step
            const nextStep = (currentStep.value + 1) % steps.value;

            // Check if we completed a loop (going from last step back to 0)
            if (currentStep.value === steps.value - 1 && nextStep === 0) {
                currentLoop.value++;
                console.log(
                    `Completed loop ${currentLoop.value}/${maxLoops.value}`
                );

                // Check if we've reached the limit
                if (currentLoop.value >= maxLoops.value) {
                    isGameOver.value = true;
                    console.log("Time's up! Game over - resetting...");

                    // Reset the game after a short delay to show the final state
                    setTimeout(() => {
                        resetGame();
                    }, 1000);

                    // Emit game over event
                    EventBus.emit("game-time-up");
                    return;
                }
            }

            currentStep.value = nextStep;

            // Calculate next step time (maintain consistent intervals)
            nextStepTime += stepTime;
        }

        // Continue the animation loop if still playing
        if (isPlaying.value && !isGameOver.value) {
            animationFrameId = requestAnimationFrame(tick);
        }
    };

    // Start the frame-based loop
    animationFrameId = requestAnimationFrame(tick);
};

const toggleStep = (trackIndex, stepIndex) => {
    // Prevent modifications while playing
    if (isPlaying.value) return;

    const track = tracks.value[trackIndex];
    const currentState = track.pattern[stepIndex];

    // If trying to activate a step, check budget
    if (!currentState && !canAddBeat(track.name)) {
        return; // Budget exceeded, don't toggle
    }

    track.pattern[stepIndex] = !currentState;
    updateBudgetUsage();
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
    const track = tracks.value[trackIndex];

    if (drawingMode.value === "activate") {
        // Check budget before activating
        if (canAddBeat(track.name)) {
            track.pattern[stepIndex] = true;
            updateBudgetUsage();
        }
    } else if (drawingMode.value === "deactivate") {
        track.pattern[stepIndex] = false;
        updateBudgetUsage();
    }
};

const clearPattern = () => {
    // Prevent modifications while playing
    if (isPlaying.value) return;

    tracks.value.forEach((track) => {
        track.pattern.fill(false);
    });
    updateBudgetUsage();
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
    updateBudgetUsage();
};

const switchLevel = () => {
    // Emit event to switch to next level
    EventBus.emit("switch-level");
};

// Update instrument configuration when level changes
const updateInstrumentConfig = (levelData) => {
    if (levelData.instrumentConfig) {
        currentLevelConfig.value = levelData.instrumentConfig;
        budgetConfig.value = { ...levelData.instrumentConfig.budgetConfig };
        currentLevelIndex.value = levelData.levelIndex;

        // Update steps based on measure count if provided
        if (levelData.measureCount) {
            steps.value = levelData.measureCount * 4; // 4 beats per measure
        }

        // Update max loops if provided
        if (levelData.maxLoops) {
            maxLoops.value = levelData.maxLoops;
        }

        // Reset all patterns when switching levels with new step count
        tracks.value.forEach((track) => {
            track.pattern = new Array(steps.value).fill(false);
        });

        // Reset budget usage
        budgetUsage.value = {
            Kick: 0,
            Snare: 0,
            "Hi-Hat": 0,
            "Open Hat": 0,
        };

        // Reset loop counter when switching levels
        currentLoop.value = 0;
        isGameOver.value = false;

        // Update budget usage display
        updateBudgetUsage();
    }
};

// Listen for game scene ready signal
EventBus.on("sequencer-ready-to-play", () => {
    console.log("Received sequencer-ready-to-play signal", {
        isPlaying: isPlaying.value,
        animationFrameId: animationFrameId,
        shouldStart: isPlaying.value && !animationFrameId,
    });

    // Only start playing if we're in the "waiting to play" state
    if (isPlaying.value && !animationFrameId) {
        console.log("Scene ready - starting sequencer playback");
        play();
    } else {
        console.log("Not starting playback - conditions not met");
    }
});

// Listen for game win to stop the sequencer
EventBus.on("player-won", () => {
    console.log("Player won! Stopping sequencer");
    stop();
});

// Listen for level changes to update instrument configuration
EventBus.on("level-changed", updateInstrumentConfig);

// Computed property to filter tracks based on level availability
const availableTracks = computed(() => {
    return tracks.value.filter((track) =>
        currentLevelConfig.value.availableInstruments.includes(track.name)
    );
});

// Computed property for budget display
const getBudgetDisplay = computed(() => {
    return (trackName) => {
        const config = budgetConfig.value[trackName];
        if (!config) {
            return "N/A";
        }
        if (config.unlimited) {
            return "Unlimited";
        }
        return `${budgetUsage.value[trackName]}/${config.max}`;
    };
});

// Computed property to calculate budget fill percentage for progress bar effect
const getBudgetFillPercentage = computed(() => {
    return (trackName) => {
        const config = budgetConfig.value[trackName];
        if (!config || config.unlimited) {
            return 0;
        }
        const usage = budgetUsage.value[trackName];
        const max = config.max;
        return max > 0 ? (usage / max) * 100 : 0;
    };
});

// Computed property to determine if budget indicator should show instrument color
const shouldShowInstrumentColor = computed(() => {
    return (trackName) => {
        const config = budgetConfig.value[trackName];
        if (!config || config.unlimited) {
            return false;
        }
        // Show instrument color when there are beats placed and instrument has a budget
        return budgetUsage.value[trackName] > 0;
    };
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
    // Initialize budget usage
    updateBudgetUsage();

    // Request current level info from the game when component mounts
    setTimeout(() => {
        EventBus.emit("request-current-level");
    }, 100);
});

// Cleanup
onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Clean up event listeners
    EventBus.off("sequencer-ready-to-play");
    EventBus.off("player-won");
    EventBus.off("level-changed", updateInstrumentConfig);
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
                class="control-btn play-stop-btn"
                @click="togglePlayStop"
                :class="{
                    playing: isPlaying,
                    stopped: !isPlaying,
                }"
            >
                {{ isPlaying ? "⏹️" : "▶️" }}
            </button>
            <button
                class="control-btn"
                @click="clearPattern"
                :disabled="isPlaying"
                :class="{ disabled: isPlaying }"
            >
                Clear
            </button>
            <button
                v-if="isDevelopment"
                class="control-btn debug-btn"
                @click="createDebugPattern"
                :disabled="isPlaying"
                :class="{ disabled: isPlaying }"
                title="Create debug pattern"
            >
                🥁
            </button>
            <button
                v-if="isDevelopment"
                class="control-btn debug-btn"
                @click="switchLevel"
                :disabled="isPlaying"
                :class="{ disabled: isPlaying }"
                title="Switch to next level"
            >
                🔄
            </button>

            <div class="bpm-control">
                <label>BPM:</label>
                <span class="bpm-display">{{ bpm }}</span>
            </div>

            <div
                class="loop-counter"
                :class="{
                    danger: currentLoop >= maxLoops - 1,
                    'game-over': isGameOver,
                }"
            >
                <label>Loops remaining:</label>
                <span class="loop-display"
                    >{{ Math.max(0, maxLoops - currentLoop) }}/{{
                        maxLoops
                    }}</span
                >
            </div>
        </div>

        <!-- Drum Grid -->
        <div class="drum-grid">
            <div
                v-for="(track, trackIndex) in availableTracks"
                :key="track.name"
                class="track-row"
            >
                <div class="track-label" :style="{ borderColor: track.color }">
                    <div class="ability-info">
                        <div class="instrument-symbol">
                            <img :src="track.icon" :alt="track.name" />
                        </div>
                        <span class="ability-name">{{ track.ability }}</span>
                    </div>
                    <div
                        class="budget-indicator"
                        :class="{
                            'budget-exceeded': isBudgetExceeded(track.name),
                        }"
                        :style="{
                            background: shouldShowInstrumentColor(track.name)
                                ? `linear-gradient(to right, ${
                                      track.color
                                  }33 ${getBudgetFillPercentage(
                                      track.name
                                  )}%, rgba(0, 0, 0, 0.1) ${getBudgetFillPercentage(
                                      track.name
                                  )}%)`
                                : 'rgba(0, 0, 0, 0.1)',
                            borderColor: shouldShowInstrumentColor(track.name)
                                ? track.color
                                : 'transparent',
                            color: shouldShowInstrumentColor(track.name)
                                ? '#333' // Darker text for better visibility
                                : '#666',
                            fontWeight: shouldShowInstrumentColor(track.name)
                                ? 'bold' // Make text bold when colored
                                : 'normal',
                        }"
                    >
                        {{ getBudgetDisplay(track.name) }}
                    </div>
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
                        @mousedown="
                            startDrawing(
                                tracks.findIndex((t) => t.name === track.name),
                                stepIndex,
                                $event
                            )
                        "
                        @mouseenter="
                            continueDrawing(
                                tracks.findIndex((t) => t.name === track.name),
                                stepIndex
                            )
                        "
                        @mouseup="
                            stopDrawing(
                                tracks.findIndex((t) => t.name === track.name),
                                stepIndex
                            )
                        "
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

/* Play/Stop button styling */
.control-btn.play-stop-btn.stopped {
    background: #4caf50; /* Green when ready to play */
    color: white;
}

.control-btn.play-stop-btn.stopped:hover {
    background: #45a049;
    transform: translateY(-1px);
}

.control-btn.play-stop-btn.playing {
    background: #f44336; /* Red when ready to stop */
    color: white;
}

.control-btn.play-stop-btn.playing:hover {
    background: #da190b;
    transform: translateY(-1px);
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

.loop-counter {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 15px;
    border-radius: 6px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
}

.loop-counter label {
    color: #fff;
    font-weight: bold;
    font-size: 14px;
}

.loop-counter .loop-display {
    min-width: 50px;
    font-weight: bold;
    color: #fff;
    background: rgba(76, 175, 80, 0.3);
    padding: 4px 8px;
    border-radius: 4px;
    text-align: center;
    border: 1px solid #4caf50;
    transition: all 0.3s ease;
}

.loop-counter.danger {
    background: rgba(255, 152, 0, 0.2);
    border-color: #ff9800;
    animation: pulse-warning 1s ease-in-out infinite;
}

.loop-counter.danger .loop-display {
    background: rgba(255, 152, 0, 0.3);
    border-color: #ff9800;
    color: #ff9800;
}

.loop-counter.game-over {
    background: rgba(244, 67, 54, 0.3);
    border-color: #f44336;
    animation: pulse-danger 0.5s ease-in-out infinite;
}

.loop-counter.game-over .loop-display {
    background: rgba(244, 67, 54, 0.3);
    border-color: #f44336;
    color: #f44336;
}

@keyframes pulse-warning {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

@keyframes pulse-danger {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.8;
        transform: scale(1.05);
    }
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
    width: 80px;
    padding: 8px;
    text-align: center;
    font-weight: bold;
    font-size: 12px;
    border: 2px solid;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.ability-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.instrument-symbol {
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 1;
}

.instrument-symbol img {
    width: 20px;
    height: 20px;
    object-fit: contain;
}

.ability-name {
    font-size: 10px;
    font-weight: bold;
    color: #333;
    line-height: 1;
}

.budget-indicator {
    font-size: 10px;
    font-weight: normal;
    color: #666;
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    line-height: 1;
    border: 1px solid transparent;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.budget-indicator.budget-exceeded {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.2);
    font-weight: bold;
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

/* Mobile styles for screens smaller than 768px */
@media (max-width: 767px) {
    .controls {
        justify-content: flex-start;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 5px;
    }

    /* Hide the debug button on mobile */
    .control-btn.debug-btn {
        display: none;
    }

    /* Hide labels in BPM control on mobile */
    .bpm-control label {
        display: none;
    }

    /* Hide labels in loop counter on mobile */
    .loop-counter label {
        display: none;
    }

    /* Make controls more compact on mobile */
    .control-btn {
        padding: 8px 12px;
        font-size: 14px;
        min-width: 40px;
        flex-shrink: 0;
    }

    .bpm-control,
    .loop-counter {
        padding: 6px 10px;
        flex-shrink: 0;
    }

    /* Make drum grid horizontally scrollable on mobile */
    .drum-grid {
        overflow-x: auto;
        padding-bottom: 10px;
    }

    .track-row {
        min-width: 600px; /* Ensure minimum width to trigger horizontal scroll */
    }

    /* Make track labels sticky and smaller on mobile */
    .track-label {
        position: sticky;
        left: 0;
        z-index: 10;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
        width: 60px;
        padding: 6px;
        font-size: 10px;
    }

    .instrument-symbol img {
        width: 16px;
        height: 16px;
    }

    .ability-name {
        font-size: 8px;
    }

    .budget-indicator {
        font-size: 8px;
        padding: 1px 3px;
    }

    /* Make step buttons smaller */
    .step-btn {
        width: 24px;
        height: 24px;
    }

    /* Adjust spacing between step groups */
    .step-btn:nth-child(4n) {
        margin-right: 8px;
    }

    .track-steps {
        gap: 2px;
        margin-left: 200px;
    }
}
</style>

