// Main Game Controller
const Game = {
    // Game settings
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 600,
    MAZE_COLS: 21, // Should be odd for maze generation
    MAZE_ROWS: 21,
    COINS_PER_LEVEL: 20,

    // Game state
    state: 'modeSelect', // 'modeSelect', 'start', 'playing', 'levelComplete', 'gameOver', 'switchPlayer', 'finalResults', 'versusComplete'

    // Game mode
    twoPlayerMode: false,
    versusMode: false, // Simultaneous two-player mode
    currentPlayer: 1, // 1 or 2

    // Player stats (savedState stores maze, coins, aliens when switching)
    playerStats: {
        1: { level: 1, totalStars: 0, lives: 3, finished: false, savedState: null },
        2: { level: 1, totalStars: 0, lives: 3, finished: false, savedState: null }
    },

    // Versus mode stats
    versusStats: {
        1: { totalCoins: 0, roundWins: 0 },
        2: { totalCoins: 0, roundWins: 0 }
    },

    level: 1,
    totalStars: 0,
    maze: null,
    player: null,
    player2: null, // Second player for versus mode
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

    selectMode(mode) {
        // mode: 'single', 'alternating', or 'versus'
        this.twoPlayerMode = (mode === 'alternating');
        this.versusMode = (mode === 'versus');
        this.state = 'start';
    },

    startGame() {
        this.currentPlayer = 1;
        this.playerStats = {
            1: { level: 1, totalStars: 0, lives: 3, finished: false, savedState: null },
            2: { level: 1, totalStars: 0, lives: 3, finished: false, savedState: null }
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

    // Save current game state for a player (used in two-player mode)
    saveGameState(playerNum) {
        this.playerStats[playerNum].savedState = {
            maze: this.maze,
            coins: CoinManager.coins.map(c => ({ ...c })), // Clone coin states
            collectedCoins: CoinManager.collectedCoins,
            totalCoins: CoinManager.totalCoins,
            aliens: AlienManager.aliens.map(a => ({ ...a })), // Clone alien states
            level: this.level,
            totalStars: this.totalStars,
            gameTime: this.gameTime
        };
    },

    // Load saved game state for a player (used in two-player mode)
    loadGameState(playerNum) {
        const saved = this.playerStats[playerNum].savedState;
        if (!saved) return false;

        this.maze = saved.maze;
        this.level = saved.level;
        this.totalStars = saved.totalStars;
        this.gameTime = saved.gameTime;

        // Restore coins
        CoinManager.coins = saved.coins.map(c => {
            const coin = new Coin(c.x, c.y);
            coin.collected = c.collected;
            coin.bobOffset = c.bobOffset;
            coin.sparkleAngle = c.sparkleAngle;
            return coin;
        });
        CoinManager.collectedCoins = saved.collectedCoins;
        CoinManager.totalCoins = saved.totalCoins;

        // Restore aliens
        AlienManager.aliens = saved.aliens.map(a => {
            const alien = new Alien(a.x, a.y, a.isChaser);
            alien.direction = a.direction;
            alien.speed = a.speed;
            alien.shootCooldown = a.shootCooldown;
            alien.directionTimer = a.directionTimer;
            return alien;
        });

        // Clear projectiles
        ProjectileManager.clear();

        return true;
    },

    nextLevel() {
        // Add stars from completed level
        const stars = CoinManager.getStars();
        this.totalStars += stars;
        this.playerStats[this.currentPlayer].totalStars += stars;

        this.level++;
        this.playerStats[this.currentPlayer].level = this.level;

        // Clear saved state since we're starting a fresh level
        this.playerStats[this.currentPlayer].savedState = null;

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
        const leavingPlayer = this.currentPlayer;
        const nextPlayer = this.currentPlayer === 1 ? 2 : 1;

        // Save current player's game state (only if they're not finished)
        if (!this.playerStats[leavingPlayer].finished) {
            this.saveGameState(leavingPlayer);
        }

        // Switch to next player
        this.currentPlayer = nextPlayer;

        // Load next player's saved state, or start fresh if none exists
        if (this.playerStats[nextPlayer].savedState) {
            this.loadGameState(nextPlayer);
        } else {
            // First time for this player - start fresh on level 1
            this.level = this.playerStats[nextPlayer].level;
            this.totalStars = this.playerStats[nextPlayer].totalStars;
            this.startLevel();
        }

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
                    this.selectMode('single');
                } else if (Input.wasJustPressed('Digit2') || Input.wasJustPressed('Numpad2')) {
                    this.selectMode('alternating');
                } else if (Input.wasJustPressed('Digit3') || Input.wasJustPressed('Numpad3')) {
                    this.selectMode('versus');
                }
                break;

            case 'start':
                if (Input.wasJustPressed('Space')) {
                    if (this.versusMode) {
                        this.startVersusGame();
                    } else {
                        this.startGame();
                    }
                }
                break;

            case 'playing':
                if (this.versusMode) {
                    this.updateVersus(deltaTime);
                } else {
                    this.updatePlaying(deltaTime);
                }
                break;

            case 'levelComplete':
                if (Input.wasJustPressed('Space')) {
                    if (this.versusMode) {
                        this.nextVersusLevel();
                    } else {
                        this.nextLevel();
                    }
                }
                break;

            case 'versusComplete':
                if (Input.wasJustPressed('Space')) {
                    this.nextVersusLevel();
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

    // ========== VERSUS MODE FUNCTIONS ==========

    startVersusGame() {
        this.level = 1;
        this.versusStats = {
            1: { totalCoins: 0, roundWins: 0, nextBonusLifeAt: 50 },
            2: { totalCoins: 0, roundWins: 0, nextBonusLifeAt: 50 }
        };

        this.startVersusLevel();
        this.state = 'playing';
        Audio.resume();
    },

    startVersusLevel() {
        // Generate new maze
        this.maze = new Maze(this.MAZE_COLS, this.MAZE_ROWS, this.cellSize);

        // Get random spawn positions for both players
        const start1 = this.maze.getRandomPathCell();
        // Player 2 spawns at least 150px away from Player 1
        const start2 = this.maze.getRandomPathCell(start1, 150);

        // Initialize Player 1 at random position
        if (!this.player) {
            this.player = new Player(start1.x, start1.y, 1);
        } else {
            this.player.respawnAt(start1.x, start1.y);
            // Don't reset lives - they persist across levels
            this.player.coinsCollected = 0;
        }

        // Initialize Player 2 at random position (away from P1)
        if (!this.player2) {
            this.player2 = new Player(start2.x, start2.y, 2);
        } else {
            this.player2.respawnAt(start2.x, start2.y);
            // Don't reset lives - they persist across levels
            this.player2.coinsCollected = 0;
        }

        // Initialize coins
        CoinManager.init(this.maze, this.COINS_PER_LEVEL);

        // Initialize aliens with split targeting
        AlienManager.initVersus(this.maze, this.level, this.player, this.player2);

        // Clear projectiles
        ProjectileManager.clear();

        this.gameTime = 0;
    },

    nextVersusLevel() {
        // Record round winner
        const winner = CoinManager.getWinner();
        if (winner) {
            this.versusStats[winner].roundWins++;
        }

        // Add coins to total
        this.versusStats[1].totalCoins += CoinManager.getCoinsForPlayer(1);
        this.versusStats[2].totalCoins += CoinManager.getCoinsForPlayer(2);

        this.level++;
        this.startVersusLevel();
        this.state = 'playing';
    },

    updateVersus(deltaTime) {
        this.gameTime += deltaTime;

        // Update both players
        if (this.player.alive) {
            this.player.update(deltaTime, this.maze);
        }
        if (this.player2.alive) {
            this.player2.update(deltaTime, this.maze);
        }

        // Track coins before update
        const p1CoinsBefore = CoinManager.getCoinsForPlayer(1);
        const p2CoinsBefore = CoinManager.getCoinsForPlayer(2);

        // Update coins for both players
        CoinManager.updateVersus(deltaTime, this.player, this.player2);

        // Check for new coins collected and bonus lives
        this.checkVersusBonusLife(this.player, p1CoinsBefore);
        this.checkVersusBonusLife(this.player2, p2CoinsBefore);

        // Update aliens
        AlienManager.updateVersus(deltaTime, this.maze, this.player, this.player2);

        // Update projectiles
        ProjectileManager.update(deltaTime, this.maze);

        // Check projectile-vs-projectile collisions (player lasers destroy alien lasers)
        ProjectileManager.checkProjectileCollisions();

        // Check projectile hits on both players
        this.checkVersusProjectileHits();

        // Check alien collision with both players
        this.checkVersusAlienCollisions();

        // Check if all coins collected (level complete)
        if (CoinManager.allCollected()) {
            this.completeVersusLevel();
        }

        // Check if either player is eliminated - game over
        if (!this.player.alive || !this.player2.alive) {
            this.state = 'versusComplete';
        }
    },

    checkVersusProjectileHits() {
        // Get all projectiles
        const projectiles = ProjectileManager.projectiles.filter(p => p.active);

        for (const proj of projectiles) {
            // Check hits on player 1
            if (this.player.alive && !this.player.invincible && proj.ownerId !== 1) {
                if (proj.hits(this.player)) {
                    proj.active = false;
                    // Alien projectile = instant life loss + alien eliminated
                    const isAlienProjectile = proj.ownerId === null;
                    if (isAlienProjectile && proj.sourceAlien && proj.sourceAlien.alive) {
                        proj.sourceAlien.die();
                    }
                    this.handleVersusPlayerHit(this.player, isAlienProjectile);
                    continue;
                }
            }

            // Check hits on player 2
            if (this.player2.alive && !this.player2.invincible && proj.ownerId !== 2) {
                if (proj.hits(this.player2)) {
                    proj.active = false;
                    // Alien projectile = instant life loss + alien eliminated
                    const isAlienProjectile = proj.ownerId === null;
                    if (isAlienProjectile && proj.sourceAlien && proj.sourceAlien.alive) {
                        proj.sourceAlien.die();
                    }
                    this.handleVersusPlayerHit(this.player2, isAlienProjectile);
                }
            }
        }
    },

    checkVersusAlienCollisions() {
        // Check player 1
        if (this.player.alive && !this.player.invincible) {
            const collidingAlien = AlienManager.getCollidingAlien(this.player);
            if (collidingAlien) {
                // Alien collision = instant life loss, alien is eliminated
                collidingAlien.die();
                this.handleVersusPlayerHit(this.player, true); // true = alien hit
            }
        }

        // Check player 2
        if (this.player2.alive && !this.player2.invincible) {
            const collidingAlien = AlienManager.getCollidingAlien(this.player2);
            if (collidingAlien) {
                // Alien collision = instant life loss, alien is eliminated
                collidingAlien.die();
                this.handleVersusPlayerHit(this.player2, true); // true = alien hit
            }
        }
    },

    handleVersusPlayerHit(player, isAlienHit = false) {
        Renderer.triggerFlash('rgba(255, 0, 0, 0.4)');

        let died;
        if (isAlienHit) {
            // Alien hit = instant life loss
            died = player.takeInstantDeath();
        } else {
            // Player-vs-player hit = 2 hits to lose a life
            died = player.takeVersusHit();
        }

        if (died && player.lives > 0) {
            // Player died but has lives left - respawn at random location
            const otherPlayer = player.playerId === 1 ? this.player2 : this.player;
            const spawnPos = this.maze.getRandomPathCell(otherPlayer, 150);
            player.respawnAt(spawnPos.x, spawnPos.y);
        } else if (died && player.lives <= 0) {
            // Player eliminated - game over
            Audio.play('gameOver');
            this.state = 'versusComplete';
        }
    },

    completeVersusLevel() {
        this.state = 'versusComplete';
        Audio.play('levelComplete');
    },

    // Check if player earned a bonus life (every 50 coins)
    checkVersusBonusLife(player, coinsBefore) {
        const coinsNow = CoinManager.getCoinsForPlayer(player.playerId);
        if (coinsNow === coinsBefore) return; // No new coins

        // Calculate total coins (previous levels + current level)
        const stats = this.versusStats[player.playerId];
        const totalCoins = stats.totalCoins + coinsNow;

        // Check if we've reached the next bonus life threshold
        if (totalCoins >= stats.nextBonusLifeAt) {
            player.lives++;
            stats.nextBonusLifeAt += 50; // Next bonus at another 50 coins
            // Visual/audio feedback for bonus life
            Renderer.triggerFlash('rgba(0, 255, 0, 0.4)'); // Green flash for bonus life
            Audio.play('levelComplete'); // Reuse level complete sound
        }
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
                Renderer.drawStartScreen(this.twoPlayerMode, this.versusMode);
                break;

            case 'playing':
                if (this.versusMode) {
                    this.renderVersus();
                } else {
                    this.renderPlaying();
                }
                break;

            case 'levelComplete':
                if (this.versusMode) {
                    this.renderVersus();
                } else {
                    this.renderPlaying();
                }
                Renderer.drawLevelComplete(this.level, CoinManager.getStars(), this.twoPlayerMode, this.currentPlayer);
                break;

            case 'versusComplete':
                this.renderVersus();
                Renderer.drawVersusComplete(this.level, CoinManager, this.versusStats, this.player, this.player2);
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
    },

    renderVersus() {
        // Draw game entities
        CoinManager.draw(Renderer.ctx, this.gameTime);
        AlienManager.draw(Renderer.ctx, this.gameTime);

        // Draw both players
        this.player.draw(Renderer.ctx);
        this.player2.draw(Renderer.ctx);

        ProjectileManager.draw(Renderer.ctx);

        // Draw screen flash effect
        Renderer.drawScreenFlash();

        // Update versus HUD
        Renderer.updateVersusHUD(this.player, this.player2, CoinManager, this.level);
    }
};

// Start the game when page loads
window.addEventListener('load', () => {
    Game.init();
});
