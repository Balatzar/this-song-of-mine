// Player movement configuration
// These values are used for both manual controls and music mode

export const PlayerConfig = {
    // Physics properties
    gravity: 3200, // Downward acceleration (higher = falls faster) - increased for faster jump timing
    dragX: 1800, // Air resistance (higher = stops faster) - increased for more responsive controls

    // Movement speeds
    horizontalSpeed: 380, // Left/right movement speed - increased for faster movement
    jumpVelocity: -950, // Jump strength (negative = upward) - balanced for good height with fast timing
    dashSpeed: 1000, // Dash movement speed - faster than regular horizontal movement
    dashDuration: 200, // Dash duration in milliseconds

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

