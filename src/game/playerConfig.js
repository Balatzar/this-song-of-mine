// Player movement configuration
// These values are used for both manual controls and music mode

export const PlayerConfig = {
    // Physics properties
    gravity: 2500, // Downward acceleration (higher = falls faster)
    dragX: 1500, // Air resistance (higher = stops faster)

    // Movement speeds
    horizontalSpeed: 320, // Left/right movement speed
    jumpVelocity: -700, // Jump strength (negative = upward)

    // Collision box settings
    bodyWidth: 64, // Player collision width
    bodyHeight: 80, // Player collision height
    bodyOffsetX: 32, // Horizontal offset for collision box
    bodyOffsetY: 44, // Vertical offset for collision box

    // Animation settings
    walkFrameRate: 10, // Walking animation speed
    jumpFrameRate: 20, // Jump animation speed
    idleFrameRate: 20, // Idle animation speed
};

