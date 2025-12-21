// Main Game Controller
const Game = {
    // Game settings
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 600,
    MAZE_COLS: 21, // Should be odd for maze generation
    MAZE_ROWS: 21,
    COINS_PER_LEVEL: 20,

    // Game state
    state: 'modeSelect', // 'modeSelect', 'start', 'playing', 'levelComplete', 'gameOver', 'switchPlayer', 'finalResults'

    // Game mode
    twoPlayerMode: false,
    currentPlayer: 1, // 1 or 2

    // Player stats
    playerStats: {
        1: { level: 1, totalStars: 0, lives: 3, finished: false },
        2: { level: 1, totalStars: 0, lives: 3, finished: false }
    },

    level: 1,
    totalStars: 0,
    maze: null,
    player: null,
    lastTime: 0,
    gameTime: 0,

    init() {
        // Initialize subsystems
        Audio.init();
        Input.init();

        // Calculate cell size to fit canvas
        const cellSize = Math.floor(Math.min(
            this.CANVAS_WIDTH / this.MAZE_COLS,
            this.CANVAS_HEIGHT / this.MAZE_ROWS
        ));

        // Adjust canvas size to fit maze exactly
        const actualWidth = cellSize * this.MAZE_COLS;
        const actualHeight = cellSize * this.MAZE_ROWS;

        Renderer.init('gameCanvas', actualWidth, actualHeight);

        // Store cell size for maze generation
        this.cellSize = cellSize;

        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    },

    selectMode(twoPlayer) {
        this.twoPlayerMode = twoPlayer;
        this.state = 'start';
    },

    startGame() {
        this.currentPlayer = 1;
        this.playerStats = {
            1: { level: 1, totalStars: 0, lives: 3, finished: false },
            2: { level: 1, totalStars: 0, lives: 3, finished: false }
        };

        this.level = 1;
        this.totalStars = 0;
        this.state = 'playing';
        this.startLevel();
        Audio.resume();
    },

    startLevel() {
        // Generate new maze
        this.maze = new Maze(this.MAZE_COLS, this.MAZE_ROWS, this.cellSize);

        // Initialize or reset player
        if (!this.player) {
            const start = this.maze.getStartPosition();
            this.player = new Player(start.x, start.y);
        } else {
            this.player.reset(this.maze);
        }

        // In two-player mode, sync lives from playerStats
        if (this.twoPlayerMode) {
            this.player.lives = this.playerStats[this.currentPlayer].lives;
        }

        // Initialize coins
        CoinManager.init(this.maze, this.COINS_PER_LEVEL);

        // Initialize aliens
        AlienManager.init(this.maze, this.level, this.player);

        // Clear projectiles
        ProjectileManager.clear();

        this.gameTime = 0;
    },

    nextLevel() {
        // Add stars from completed level
        const stars = CoinManager.getStars();
        this.totalStars += stars;
        this.playerStats[this.currentPlayer].totalStars += stars;

        this.level++;
        this.playerStats[this.currentPlayer].level = this.level;
        this.startLevel();
        this.state = 'playing';
    },

    handleGameOver() {
        // Save current player's final stats
        this.playerStats[this.currentPlayer].totalStars = this.totalStars;
        this.playerStats[this.currentPlayer].finished = true;

        if (this.twoPlayerMode && this.currentPlayer === 1 && !this.playerStats[2].finished) {
            // Switch to player 2
            this.state = 'switchPlayer';
        } else {
            // Show final results
            this.state = this.twoPlayerMode ? 'finalResults' : 'gameOver';
        }

        Audio.play('gameOver');
    },

    switchToNextPlayer() {
        const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.currentPlayer = nextPlayer;

        // Sync the player object's lives with the new current player's lives
        this.player.lives = this.playerStats[this.currentPlayer].lives;
        this.player.invincible = true;
        this.player.invincibilityTimer = 2;

        // Respawn at start position
        this.player.respawn(this.maze);

        this.state = 'playing';
    },

    gameLoop(currentTime) {
        // Calculate delta time in seconds
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        // Reset just-pressed states
        Input.update();

        requestAnimationFrame((time) => this.gameLoop(time));
    },

    update(deltaTime) {
        switch (this.state) {
            case 'modeSelect':
                if (Input.wasJustPressed('Digit1') || Input.wasJustPressed('Numpad1')) {
                    this.selectMode(false);
                } else if (Input.wasJustPressed('Digit2') || Input.wasJustPressed('Numpad2')) {
                    this.selectMode(true);
                }
                break;

            case 'start':
                if (Input.wasJustPressed('Space')) {
                    this.startGame();
                }
                break;

            case 'playing':
                this.updatePlaying(deltaTime);
                break;

            case 'levelComplete':
                if (Input.wasJustPressed('Space')) {
                    this.nextLevel();
                }
                break;

            case 'switchPlayer':
                if (Input.wasJustPressed('Space')) {
                    this.switchToNextPlayer();
                }
                break;

            case 'gameOver':
            case 'finalResults':
                if (Input.wasJustPressed('KeyR')) {
                    this.state = 'modeSelect';
                }
                break;
        }
    },

    updatePlaying(deltaTime) {
        this.gameTime += deltaTime;

        // Update player
        this.player.update(deltaTime, this.maze);

        // Update coins
        CoinManager.update(deltaTime, this.player);

        // Update aliens
        AlienManager.update(deltaTime, this.maze, this.player);

        // Update projectiles
        ProjectileManager.update(deltaTime, this.maze);

        // Check alien projectile hits on player
        if (this.player.alive && !this.player.invincible) {
            const alienProjectiles = ProjectileManager.getAlienProjectiles();
            for (const proj of alienProjectiles) {
                if (proj.active && proj.hits(this.player)) {
                    proj.active = false;
                    this.handlePlayerHit();
                    break;
                }
            }
        }

        // Check alien collision with player
        if (this.player.alive && !this.player.invincible) {
            if (AlienManager.checkPlayerCollision(this.player)) {
                this.handlePlayerHit();
            }
        }

        // Check if all coins collected (level complete)
        if (this.player.alive && CoinManager.allCollected()) {
            this.completeLevel();
        }
    },

    handlePlayerHit() {
        Renderer.triggerFlash('rgba(255, 0, 0, 0.4)');

        if (this.twoPlayerMode) {
            // Two-player mode: handle turn alternation
            Audio.play('playerHit');
            this.playerStats[this.currentPlayer].lives--;
            this.player.lives = this.playerStats[this.currentPlayer].lives;

            const currentPlayerDead = this.playerStats[this.currentPlayer].lives <= 0;
            const otherPlayer = this.currentPlayer === 1 ? 2 : 1;
            const otherPlayerDead = this.playerStats[otherPlayer].finished;

            if (currentPlayerDead) {
                // Current player is out of lives
                this.playerStats[this.currentPlayer].finished = true;
                Audio.play('gameOver');

                if (otherPlayerDead) {
                    // Both players are finished
                    this.state = 'finalResults';
                } else {
                    // Switch to other player who still has lives
                    this.state = 'switchPlayer';
                }
            } else if (!otherPlayerDead) {
                // Current player still has lives, other player also still in game
                // Switch turns
                this.state = 'switchPlayer';
            } else {
                // Current player still has lives, but other player is out
                // Continue playing solo
                this.player.respawn(this.maze);
            }
        } else {
            // Single player mode: original behavior
            const isDead = this.player.takeDamage();

            if (isDead) {
                this.handleGameOver();
            } else {
                // Respawn player at start
                this.player.respawn(this.maze);
            }
        }
    },

    completeLevel() {
        this.state = 'levelComplete';
        Audio.play('levelComplete');
    },

    render() {
        // Clear canvas
        Renderer.clear();

        // Always draw maze as background (except mode select)
        if (this.maze && this.state !== 'modeSelect') {
            Renderer.drawMaze(this.maze);
        }

        switch (this.state) {
            case 'modeSelect':
                Renderer.drawModeSelect();
                break;

            case 'start':
                Renderer.drawStartScreen(this.twoPlayerMode);
                break;

            case 'playing':
                this.renderPlaying();
                break;

            case 'levelComplete':
                this.renderPlaying();
                Renderer.drawLevelComplete(this.level, CoinManager.getStars(), this.twoPlayerMode, this.currentPlayer);
                break;

            case 'switchPlayer':
                this.renderPlaying();
                const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
                Renderer.drawSwitchPlayer(this.currentPlayer, nextPlayer, this.playerStats);
                break;

            case 'gameOver':
                this.renderPlaying();
                Renderer.drawGameOver(this.level, this.totalStars);
                break;

            case 'finalResults':
                this.renderPlaying();
                Renderer.drawFinalResults(this.playerStats);
                break;
        }
    },

    renderPlaying() {
        // Draw game entities
        CoinManager.draw(Renderer.ctx, this.gameTime);
        AlienManager.draw(Renderer.ctx, this.gameTime);
        this.player.draw(Renderer.ctx);
        ProjectileManager.draw(Renderer.ctx);

        // Draw screen flash effect
        Renderer.drawScreenFlash();

        // Update HUD
        Renderer.updateHUD(this.player, CoinManager, this.level, CoinManager.getStars(), this.twoPlayerMode, this.currentPlayer);
    }
};

// Start the game when page loads
window.addEventListener('load', () => {
    Game.init();
});
