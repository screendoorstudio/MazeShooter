// Coin Class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.collected = false;
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

    collect() {
        this.collected = true;
    }

    checkCollection(player) {
        if (this.collected) return false;

        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + player.radius) {
            this.collect();
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

    init(maze, count = 20) {
        this.coins = [];
        this.collectedCoins = 0;
        this.totalCoins = count;

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

    clear() {
        this.coins = [];
        this.collectedCoins = 0;
        this.totalCoins = 0;
    }
};
