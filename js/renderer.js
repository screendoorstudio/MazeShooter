// Renderer - Handles all canvas drawing
const Renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    screenFlash: 0,
    screenFlashColor: 'rgba(255, 0, 0, 0.3)',

    init(canvasId, width, height) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    },

    clear() {
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    drawMaze(maze) {
        const ctx = this.ctx;
        const cellSize = maze.cellSize;

        for (let row = 0; row < maze.rows; row++) {
            for (let col = 0; col < maze.cols; col++) {
                const x = col * cellSize;
                const y = row * cellSize;

                if (maze.isWall(col, row)) {
                    // Wall
                    ctx.fillStyle = '#3498db';
                    ctx.fillRect(x, y, cellSize, cellSize);

                    // Wall shading for depth
                    ctx.fillStyle = '#2980b9';
                    ctx.fillRect(x, y + cellSize - 3, cellSize, 3);
                    ctx.fillRect(x + cellSize - 3, y, 3, cellSize);
                } else {
                    // Floor
                    ctx.fillStyle = '#ecf0f1';
                    ctx.fillRect(x, y, cellSize, cellSize);
                }
            }
        }
    },

    drawExit(maze) {
        const ctx = this.ctx;
        const exit = maze.getExitPosition();
        const size = maze.cellSize * 0.8;

        ctx.save();

        // Pulsing glow effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 20 * pulse;

        // Exit marker (green square with arrow)
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(exit.x - size / 2, exit.y - size / 2, size, size);

        // Arrow inside
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(exit.x - size * 0.2, exit.y - size * 0.2);
        ctx.lineTo(exit.x + size * 0.3, exit.y);
        ctx.lineTo(exit.x - size * 0.2, exit.y + size * 0.2);
        ctx.closePath();
        ctx.fill();

        // "EXIT" text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#27ae60';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', exit.x, exit.y + size / 2 + 12);

        ctx.restore();
    },

    drawScreenFlash() {
        if (this.screenFlash > 0) {
            this.ctx.fillStyle = this.screenFlashColor.replace('0.3', (this.screenFlash * 0.3).toString());
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.screenFlash -= 0.05;
        }
    },

    triggerFlash(color = 'rgba(255, 0, 0, 0.3)') {
        this.screenFlash = 1;
        this.screenFlashColor = color;
    },

    drawModeSelect() {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.width, this.height);

        // Title
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MAZE SHOOTER', this.width / 2, this.height / 2 - 100);

        // Subtitle
        ctx.fillStyle = '#e74c3c';
        ctx.font = '24px Arial';
        ctx.fillText('Select Game Mode', this.width / 2, this.height / 2 - 50);

        // Mode options
        const blink = Math.floor(Date.now() / 500) % 2;

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = blink ? '#2ecc71' : '#27ae60';
        ctx.fillText('Press 1 for Single Player', this.width / 2, this.height / 2 + 10);

        ctx.fillStyle = blink ? '#9b59b6' : '#8e44ad';
        ctx.fillText('Press 2 for Two Players (Alternating)', this.width / 2, this.height / 2 + 50);

        ctx.fillStyle = blink ? '#e74c3c' : '#c0392b';
        ctx.fillText('Press 3 for Versus Mode', this.width / 2, this.height / 2 + 90);

        // Description
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '14px Arial';
        ctx.fillText('Versus: Both players compete simultaneously!', this.width / 2, this.height / 2 + 130);
    },

    drawStartScreen(twoPlayerMode = false, versusMode = false) {
        const ctx = this.ctx;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Title
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MAZE SHOOTER', this.width / 2, this.height / 2 - 100);

        // Mode indicator
        if (versusMode) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('VERSUS MODE', this.width / 2, this.height / 2 - 60);

            // Versus instructions
            ctx.fillStyle = '#ecf0f1';
            ctx.font = '16px Arial';
            ctx.fillText('P1: Arrow Keys + Right Shift to Shoot', this.width / 2, this.height / 2 - 20);
            ctx.fillText('P2: WASD + Left Shift to Shoot', this.width / 2, this.height / 2 + 5);

            ctx.fillStyle = '#ffd700';
            ctx.font = '18px Arial';
            ctx.fillText('Collect the most coins to win!', this.width / 2, this.height / 2 + 40);
            ctx.fillText('3 hits = lose a life (3 lives each)', this.width / 2, this.height / 2 + 65);
        } else if (twoPlayerMode) {
            ctx.fillStyle = '#9b59b6';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('TWO PLAYER MODE', this.width / 2, this.height / 2 - 60);

            // Standard instructions
            ctx.fillStyle = '#ecf0f1';
            ctx.font = '18px Arial';
            ctx.fillText('Arrow Keys to Move, Space to Shoot', this.width / 2, this.height / 2 - 10);
            ctx.fillText('Collect All Coins to Complete Level!', this.width / 2, this.height / 2 + 20);
            ctx.fillText('Players alternate when hit', this.width / 2, this.height / 2 + 50);
        } else {
            // Single player
            ctx.fillStyle = '#e74c3c';
            ctx.font = '24px Arial';
            ctx.fillText('Survive the Aliens!', this.width / 2, this.height / 2 - 40);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = '18px Arial';
            ctx.fillText('Arrow Keys to Move', this.width / 2, this.height / 2 + 10);
            ctx.fillText('Space to Shoot', this.width / 2, this.height / 2 + 35);
            ctx.fillText('Collect All Coins to Complete Level!', this.width / 2, this.height / 2 + 60);
        }

        // Start prompt
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 24px Arial';
        const blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 110);
        }
    },

    drawGameOver(finalLevel, totalStars) {
        const ctx = this.ctx;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Game Over text
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 60);

        // Stats
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '24px Arial';
        ctx.fillText(`Reached Level ${finalLevel}`, this.width / 2, this.height / 2);
        ctx.fillText(`Total Stars: ${totalStars}`, this.width / 2, this.height / 2 + 35);

        // Restart prompt
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 20px Arial';
        const blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillText('Press R to Play Again', this.width / 2, this.height / 2 + 90);
        }
    },

    drawLevelComplete(level, stars, twoPlayerMode = false, currentPlayer = 1) {
        const ctx = this.ctx;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Player indicator for two player mode
        if (twoPlayerMode) {
            ctx.fillStyle = currentPlayer === 1 ? '#3498db' : '#9b59b6';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`PLAYER ${currentPlayer}`, this.width / 2, this.height / 2 - 90);
        }

        // Level Complete text
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${level} COMPLETE!`, this.width / 2, this.height / 2 - 40);

        // Stars
        ctx.font = '48px Arial';
        let starsText = '';
        for (let i = 0; i < 3; i++) {
            starsText += i < stars ? '★' : '☆';
        }
        ctx.fillStyle = '#ffd700';
        ctx.fillText(starsText, this.width / 2, this.height / 2 + 30);

        // Continue prompt
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 20px Arial';
        const blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillText('Press SPACE for Next Level', this.width / 2, this.height / 2 + 90);
        }
    },

    drawSwitchPlayer(currentPlayer, nextPlayer, playerStats) {
        const ctx = this.ctx;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.width, this.height);

        const currentStats = playerStats[currentPlayer];
        const currentColor = currentPlayer === 1 ? '#3498db' : '#9b59b6';
        const nextColor = nextPlayer === 1 ? '#3498db' : '#9b59b6';

        // Check if current player is out of lives
        if (currentStats.finished) {
            // Current player is eliminated
            ctx.fillStyle = currentColor;
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`PLAYER ${currentPlayer} IS OUT!`, this.width / 2, this.height / 2 - 100);

            // Current player stats
            ctx.fillStyle = '#ecf0f1';
            ctx.font = '24px Arial';
            ctx.fillText(`Reached Level ${currentStats.level}`, this.width / 2, this.height / 2 - 50);
            ctx.fillText(`Stars Earned: ${currentStats.totalStars}`, this.width / 2, this.height / 2 - 15);

            // Next player prompt
            ctx.fillStyle = nextColor;
            ctx.font = 'bold 36px Arial';
            ctx.fillText(`PLAYER ${nextPlayer} - YOUR TURN!`, this.width / 2, this.height / 2 + 50);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = '20px Arial';
            ctx.fillText(`Can you beat Player ${currentPlayer}'s score?`, this.width / 2, this.height / 2 + 90);
        } else {
            // Regular turn switch (player was hit but still has lives)
            ctx.fillStyle = currentColor;
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`PLAYER ${currentPlayer} WAS HIT!`, this.width / 2, this.height / 2 - 80);

            // Show lives remaining
            ctx.fillStyle = '#ecf0f1';
            ctx.font = '24px Arial';
            ctx.fillText(`Lives remaining: ${currentStats.lives}`, this.width / 2, this.height / 2 - 30);

            // Next player prompt
            ctx.fillStyle = nextColor;
            ctx.font = 'bold 36px Arial';
            ctx.fillText(`PLAYER ${nextPlayer} - YOUR TURN!`, this.width / 2, this.height / 2 + 30);
        }

        // Continue prompt
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 24px Arial';
        const blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillText('Press SPACE to Continue', this.width / 2, this.height / 2 + 120);
        }
    },

    drawFinalResults(playerStats) {
        const ctx = this.ctx;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Title
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('FINAL RESULTS', this.width / 2, this.height / 2 - 130);

        // Player 1 stats
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('PLAYER 1', this.width / 2 - 120, this.height / 2 - 70);
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '20px Arial';
        ctx.fillText(`Level: ${playerStats[1].level}`, this.width / 2 - 120, this.height / 2 - 35);
        ctx.fillText(`Stars: ${playerStats[1].totalStars}`, this.width / 2 - 120, this.height / 2 - 5);

        // Player 2 stats
        ctx.fillStyle = '#9b59b6';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('PLAYER 2', this.width / 2 + 120, this.height / 2 - 70);
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '20px Arial';
        ctx.fillText(`Level: ${playerStats[2].level}`, this.width / 2 + 120, this.height / 2 - 35);
        ctx.fillText(`Stars: ${playerStats[2].totalStars}`, this.width / 2 + 120, this.height / 2 - 5);

        // Determine winner
        const p1Score = playerStats[1].level * 10 + playerStats[1].totalStars;
        const p2Score = playerStats[2].level * 10 + playerStats[2].totalStars;

        ctx.font = 'bold 36px Arial';
        if (p1Score > p2Score) {
            ctx.fillStyle = '#3498db';
            ctx.fillText('PLAYER 1 WINS!', this.width / 2, this.height / 2 + 60);
        } else if (p2Score > p1Score) {
            ctx.fillStyle = '#9b59b6';
            ctx.fillText('PLAYER 2 WINS!', this.width / 2, this.height / 2 + 60);
        } else {
            ctx.fillStyle = '#2ecc71';
            ctx.fillText('IT\'S A TIE!', this.width / 2, this.height / 2 + 60);
        }

        // Restart prompt
        ctx.fillStyle = '#7f8c8d';
        ctx.font = 'bold 20px Arial';
        const blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillText('Press R to Play Again', this.width / 2, this.height / 2 + 120);
        }
    },

    updateHUD(player, coins, level, stars, twoPlayerMode = false, currentPlayer = 1) {
        // Update lives
        const livesDiv = document.getElementById('lives');
        livesDiv.innerHTML = '';

        // Add player indicator for two player mode
        if (twoPlayerMode) {
            const playerIndicator = document.createElement('span');
            playerIndicator.style.marginRight = '10px';
            playerIndicator.style.color = currentPlayer === 1 ? '#3498db' : '#9b59b6';
            playerIndicator.style.fontWeight = 'bold';
            playerIndicator.textContent = `P${currentPlayer}`;
            livesDiv.appendChild(playerIndicator);
        }

        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart' + (i < player.lives ? '' : ' empty');
            heart.innerHTML = '❤️';
            heart.style.fontSize = '20px';
            heart.style.opacity = i < player.lives ? '1' : '0.3';
            heart.style.display = 'inline-block';
            livesDiv.appendChild(heart);
        }

        // Update coins
        document.getElementById('coinCount').textContent = coins.collectedCoins;
        document.getElementById('totalCoins').textContent = coins.totalCoins;

        // Update level
        document.getElementById('levelNum').textContent = level;

        // Update stars preview
        const currentStars = coins.getStars();
        const starsDiv = document.getElementById('stars');
        starsDiv.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'star' + (i < currentStars ? ' filled' : '');
            star.textContent = i < currentStars ? '★' : '☆';
            starsDiv.appendChild(star);
        }
    },

    // Versus mode HUD
    updateVersusHUD(player1, player2, coins, level) {
        const livesDiv = document.getElementById('lives');
        livesDiv.innerHTML = '';

        // Player 1 indicator and lives
        const p1Indicator = document.createElement('span');
        p1Indicator.style.color = '#3498db';
        p1Indicator.style.fontWeight = 'bold';
        p1Indicator.style.marginRight = '5px';
        p1Indicator.textContent = 'P1:';
        livesDiv.appendChild(p1Indicator);

        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('span');
            heart.innerHTML = '❤️';
            heart.style.fontSize = '16px';
            heart.style.opacity = i < player1.lives ? '1' : '0.3';
            livesDiv.appendChild(heart);
        }

        // Spacer
        const spacer = document.createElement('span');
        spacer.innerHTML = ' | ';
        spacer.style.margin = '0 10px';
        livesDiv.appendChild(spacer);

        // Player 2 indicator and lives
        const p2Indicator = document.createElement('span');
        p2Indicator.style.color = '#264d8a';
        p2Indicator.style.fontWeight = 'bold';
        p2Indicator.style.marginRight = '5px';
        p2Indicator.textContent = 'P2:';
        livesDiv.appendChild(p2Indicator);

        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('span');
            heart.innerHTML = '❤️';
            heart.style.fontSize = '16px';
            heart.style.opacity = i < player2.lives ? '1' : '0.3';
            livesDiv.appendChild(heart);
        }

        // Update coins display to show per-player
        const coinDiv = document.getElementById('coins');
        if (coinDiv) {
            coinDiv.innerHTML = `<span style="color:#3498db">P1: ${coins.getCoinsForPlayer(1)}</span> | <span style="color:#264d8a">P2: ${coins.getCoinsForPlayer(2)}</span>`;
        } else {
            document.getElementById('coinCount').textContent = coins.getCoinsForPlayer(1);
            document.getElementById('totalCoins').textContent = coins.getCoinsForPlayer(2);
        }

        // Update level
        document.getElementById('levelNum').textContent = level;

        // Hide stars for versus mode (replace with coin counts)
        const starsDiv = document.getElementById('stars');
        starsDiv.innerHTML = `<span style="font-size:14px">Total: ${coins.collectedCoins}/${coins.totalCoins}</span>`;
    },

    // Versus round complete screen
    drawVersusComplete(level, coins, versusStats, player1, player2) {
        const ctx = this.ctx;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Determine round winner
        const p1Coins = coins.getCoinsForPlayer(1);
        const p2Coins = coins.getCoinsForPlayer(2);
        const winner = coins.getWinner();

        // Title
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`LEVEL ${level} COMPLETE!`, this.width / 2, this.height / 2 - 100);

        // Round results
        ctx.font = 'bold 24px Arial';

        // Player 1 coins
        ctx.fillStyle = winner === 1 ? '#ffd700' : '#3498db';
        ctx.fillText(`P1: ${p1Coins} coins`, this.width / 2 - 100, this.height / 2 - 40);
        if (winner === 1) {
            ctx.fillText('👑', this.width / 2 - 180, this.height / 2 - 40);
        }

        // Player 2 coins
        ctx.fillStyle = winner === 2 ? '#ffd700' : '#264d8a';
        ctx.fillText(`P2: ${p2Coins} coins`, this.width / 2 + 100, this.height / 2 - 40);
        if (winner === 2) {
            ctx.fillText('👑', this.width / 2 + 180, this.height / 2 - 40);
        }

        // Winner announcement
        ctx.font = 'bold 32px Arial';
        if (winner === 1) {
            ctx.fillStyle = '#3498db';
            ctx.fillText('PLAYER 1 WINS THE ROUND!', this.width / 2, this.height / 2 + 20);
        } else if (winner === 2) {
            ctx.fillStyle = '#264d8a';
            ctx.fillText('PLAYER 2 WINS THE ROUND!', this.width / 2, this.height / 2 + 20);
        } else {
            ctx.fillStyle = '#2ecc71';
            ctx.fillText('IT\'S A TIE!', this.width / 2, this.height / 2 + 20);
        }

        // Running totals
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '18px Arial';
        ctx.fillText(`Total Coins - P1: ${versusStats[1].totalCoins + p1Coins} | P2: ${versusStats[2].totalCoins + p2Coins}`, this.width / 2, this.height / 2 + 60);
        ctx.fillText(`Round Wins - P1: ${versusStats[1].roundWins + (winner === 1 ? 1 : 0)} | P2: ${versusStats[2].roundWins + (winner === 2 ? 1 : 0)}`, this.width / 2, this.height / 2 + 85);

        // Continue prompt
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 24px Arial';
        const blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillText('Press SPACE for Next Level', this.width / 2, this.height / 2 + 130);
        }
    }
};
