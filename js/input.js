// Input Handler - Manages keyboard state
const Input = {
    keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false,
        KeyR: false,
        Digit1: false,
        Digit2: false,
        Numpad1: false,
        Numpad2: false
    },

    justPressed: {
        Space: false,
        KeyR: false,
        Digit1: false,
        Digit2: false,
        Numpad1: false,
        Numpad2: false
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

    // Get movement direction as a vector
    getMovementVector() {
        let dx = 0;
        let dy = 0;

        if (this.keys.ArrowUp) dy = -1;
        if (this.keys.ArrowDown) dy = 1;
        if (this.keys.ArrowLeft) dx = -1;
        if (this.keys.ArrowRight) dx = 1;

        return { dx, dy };
    }
};
