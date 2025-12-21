// Input Handler - Manages keyboard state
const Input = {
    keys: {
        // Player 1 movement (Arrow keys)
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        // Player 2 movement (WASD)
        KeyW: false,
        KeyA: false,
        KeyS: false,
        KeyD: false,
        // Shooting (Shift keys)
        ShiftLeft: false,
        ShiftRight: false,
        // Menu/actions
        Space: false,
        KeyR: false,
        Digit1: false,
        Digit2: false,
        Digit3: false,
        Numpad1: false,
        Numpad2: false,
        Numpad3: false
    },

    justPressed: {
        ShiftLeft: false,
        ShiftRight: false,
        Space: false,
        KeyR: false,
        Digit1: false,
        Digit2: false,
        Digit3: false,
        Numpad1: false,
        Numpad2: false,
        Numpad3: false
    },

    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    },

    handleKeyDown(e) {
        const key = e.code;
        if (key in this.keys) {
            // Track "just pressed" for single-fire actions
            if (!this.keys[key]) {
                this.justPressed[key] = true;
            }
            this.keys[key] = true;
            e.preventDefault();
        }
        // Also handle spacebar with 'Space' key
        if (key === 'Space') {
            e.preventDefault();
        }
    },

    handleKeyUp(e) {
        const key = e.code;
        if (key in this.keys) {
            this.keys[key] = false;
            e.preventDefault();
        }
    },

    // Call at end of frame to reset just-pressed states
    update() {
        for (let key in this.justPressed) {
            this.justPressed[key] = false;
        }
    },

    isDown(key) {
        return this.keys[key] || false;
    },

    wasJustPressed(key) {
        return this.justPressed[key] || false;
    },

    // Get movement direction as a vector (legacy - uses arrow keys)
    getMovementVector() {
        let dx = 0;
        let dy = 0;

        if (this.keys.ArrowUp) dy = -1;
        if (this.keys.ArrowDown) dy = 1;
        if (this.keys.ArrowLeft) dx = -1;
        if (this.keys.ArrowRight) dx = 1;

        return { dx, dy };
    },

    // Get movement vector for a specific player
    // Player 1: Arrow keys, Player 2: WASD
    getMovementVectorForPlayer(playerId) {
        let dx = 0;
        let dy = 0;

        if (playerId === 1) {
            if (this.keys.ArrowUp) dy = -1;
            if (this.keys.ArrowDown) dy = 1;
            if (this.keys.ArrowLeft) dx = -1;
            if (this.keys.ArrowRight) dx = 1;
        } else if (playerId === 2) {
            if (this.keys.KeyW) dy = -1;
            if (this.keys.KeyS) dy = 1;
            if (this.keys.KeyA) dx = -1;
            if (this.keys.KeyD) dx = 1;
        }

        return { dx, dy };
    },

    // Check if player's shoot key was just pressed
    // Player 1: Right Shift, Player 2: Left Shift
    isShootPressed(playerId) {
        if (playerId === 1) {
            return this.justPressed.ShiftRight;
        } else if (playerId === 2) {
            return this.justPressed.ShiftLeft;
        }
        return false;
    }
};
