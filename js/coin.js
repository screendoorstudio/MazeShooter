// Coin Class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.collected = false;
        this.collectedBy = null; // Track which player collected (for versus mode)
        this.bobOffset = Math.random() * Math.PI * 2; // Random start for bobbing animation
        this.sparkleAngle = 0;
    }

    update(deltaTime) {
        if (this.collected) return;

        // Update sparkle animation
        this.sparkleAngle += deltaTime * 3;
    }

    draw(ctx, time) {
        if (this.collected) return;

        ctx.save();

        // Bobbing animation
        const bobY = Math.sin(time * 3 + this.bobOffset) * 2;

        // Outer glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;

        // Main coin body
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();

        // Inner highlight
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y + bobY - 3, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff8dc';
        ctx.fill();

        // Dollar sign or star
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#b8860b';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', this.x, this.y + bobY + 1);

        ctx.restore();
    }

    collect(playerId = null) {
        this.collected = true;
        this.collectedBy = playerId;
    }

    checkCollection(player) {
        if (this.collected) return false;

        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + player.radius) {
            this.collect(player.playerId);
            return true;
        }
        return false;
    }
}

// Coin Manager
const CoinManager = {
    coins: [],
    totalCoins: 0,
    collectedCoins: 0,
    coinsPerPlayer: { 1: 0, 2: 0 }, // Track coins per player for versus mode

    init(maze, count = 20) {
        this.coins = [];
        this.collectedCoins = 0;
        this.totalCoins = count;
        this.coinsPerPlayer = { 1: 0, 2: 0 };

        const pathCells = maze.getPathCells();
        const startPos = maze.getStartPosition();
        const exitPos = maze.getExitPosition();

        // Filter out cells too close to start or exit
        const validCells = pathCells.filter(cell => {
            const distToStart = Math.sqrt(
                Math.pow(cell.x - startPos.x, 2) + Math.pow(cell.y - startPos.y, 2)
            );
            const distToExit = Math.sqrt(
                Math.pow(cell.x - exitPos.x, 2) + Math.pow(cell.y - exitPos.y, 2)
            );
            return distToStart > maze.cellSize * 2 && distToExit > maze.cellSize * 2;
        });

        // Shuffle and pick cells for coins
        this.shuffle(validCells);

        const numCoins = Math.min(count, validCells.length);
        this.totalCoins = numCoins;

        for (let i = 0; i < numCoins; i++) {
            const cell = validCells[i];
            this.coins.push(new Coin(cell.x, cell.y));
        }
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    update(deltaTime, player) {
        this.coins.forEach(coin => {
            coin.update(deltaTime);
            if (coin.checkCollection(player)) {
                this.collectedCoins++;
                if (player.playerId) {
                    this.coinsPerPlayer[player.playerId]++;
                    player.coinsCollected++;
                }
                Audio.play('coin');
            }
        });
    },

    // Update for versus mode with two players
    updateVersus(deltaTime, player1, player2) {
        this.coins.forEach(coin => {
            coin.update(deltaTime);
            // Check player 1
            if (player1.alive && coin.checkCollection(player1)) {
                this.collectedCoins++;
                this.coinsPerPlayer[1]++;
                player1.coinsCollected++;
                Audio.play('coin');
            }
            // Check player 2
            else if (player2.alive && coin.checkCollection(player2)) {
                this.collectedCoins++;
                this.coinsPerPlayer[2]++;
                player2.coinsCollected++;
                Audio.play('coin');
            }
        });
    },

    draw(ctx, time) {
        this.coins.forEach(coin => coin.draw(ctx, time));
    },

    getStars() {
        if (this.totalCoins === 0) return 3;

        const percentage = this.collectedCoins / this.totalCoins;

        if (percentage >= 0.67) return 3;
        if (percentage >= 0.34) return 2;
        return 1;
    },

    allCollected() {
        return this.totalCoins > 0 && this.collectedCoins >= this.totalCoins;
    },

    // Get coins collected by a specific player
    getCoinsForPlayer(playerId) {
        return this.coinsPerPlayer[playerId] || 0;
    },

    // Get the winner (player with most coins) or null for tie
    getWinner() {
        if (this.coinsPerPlayer[1] > this.coinsPerPlayer[2]) {
            return 1;
        } else if (this.coinsPerPlayer[2] > this.coinsPerPlayer[1]) {
            return 2;
        }
        return null; // Tie
    },

    clear() {
        this.coins = [];
        this.collectedCoins = 0;
        this.totalCoins = 0;
        this.coinsPerPlayer = { 1: 0, 2: 0 };
    }
};
