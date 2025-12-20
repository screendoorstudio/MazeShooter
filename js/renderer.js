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

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = blink ? '#2ecc71' : '#27ae60';
        ctx.fillText('Press 1 for Single Player', this.width / 2, this.height / 2 + 20);

        ctx.fillStyle = blink ? '#9b59b6' : '#8e44ad';
        ctx.fillText('Press 2 for Two Players', this.width / 2, this.height / 2 + 70);

        // Description
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '16px Arial';
        ctx.fillText('(Two players take turns - highest score wins!)', this.width / 2, this.height / 2 + 110);
    },

    drawStartScreen(twoPlayerMode = false) {
        const ctx = this.ctx;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Title
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MAZE SHOOTER', this.width / 2, this.height / 2 - 80);

        // Mode indicator
        if (twoPlayerMode) {
            ctx.fillStyle = '#9b59b6';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('TWO PLAYER MODE', this.width / 2, this.height / 2 - 40);
        }

        // Subtitle
        ctx.fillStyle = '#e74c3c';
        ctx.font = '24px Arial';
        ctx.fillText('Survive the Aliens!', this.width / 2, this.height / 2);

        // Instructions
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '18px Arial';
        ctx.fillText('Arrow Keys to Move', this.width / 2, this.height / 2 + 40);
        ctx.fillText('Space to Shoot', this.width / 2, this.height / 2 + 65);
        ctx.fillText('Collect Coins & Reach the Exit!', this.width / 2, this.height / 2 + 90);

        // Start prompt
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 24px Arial';
        const blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 140);
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

    drawSwitchPlayer(player1Stats) {
        const ctx = this.ctx;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Player 1 finished
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PLAYER 1 FINISHED!', this.width / 2, this.height / 2 - 100);

        // Player 1 stats
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '24px Arial';
        ctx.fillText(`Reached Level ${player1Stats.level}`, this.width / 2, this.height / 2 - 50);
        ctx.fillText(`Stars Earned: ${player1Stats.totalStars}`, this.width / 2, this.height / 2 - 15);

        // Player 2 prompt
        ctx.fillStyle = '#9b59b6';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('PLAYER 2 - YOUR TURN!', this.width / 2, this.height / 2 + 50);

        ctx.fillStyle = '#ecf0f1';
        ctx.font = '20px Arial';
        ctx.fillText('Can you beat Player 1\'s score?', this.width / 2, this.height / 2 + 90);

        // Continue prompt
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 24px Arial';
        const blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 140);
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
    }
};
