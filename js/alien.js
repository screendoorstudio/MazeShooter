// Alien Class
class Alien {
    constructor(x, y, isChaser = false) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.speed = 60; // Base speed (pixels per second)
        this.isChaser = isChaser;
        this.alive = true;
        this.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        this.directionChangeTimer = 0;
        this.directionChangeInterval = 0.5 + Math.random() * 1; // Random interval for wanderers
        this.shootCooldown = 1 + Math.random() * 1.5; // Random initial cooldown
        this.shootCooldownTime = 1.5 + Math.random() * 0.5; // Time between shots (faster)
        this.animationOffset = Math.random() * Math.PI * 2;
        this.targetPlayerId = null; // For versus mode split targeting
    }

    update(deltaTime, maze, player) {
        if (!this.alive) return;

        // Update shoot cooldown
        this.shootCooldown -= deltaTime;

        // Try to shoot at player
        if (this.shootCooldown <= 0 && player.alive) {
            this.tryShoot(player, maze);
        }

        // Update direction change timer for wanderers
        this.directionChangeTimer += deltaTime;

        // Choose movement behavior
        if (this.isChaser) {
            this.chasePlayer(deltaTime, maze, player);
        } else {
            this.wander(deltaTime, maze);
        }
    }

    chasePlayer(deltaTime, maze, player) {
        if (!player.alive) {
            this.wander(deltaTime, maze);
            return;
        }

        // Calculate direction to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;

        // Choose primary direction based on larger distance
        let primaryDir, secondaryDir;

        if (Math.abs(dx) > Math.abs(dy)) {
            primaryDir = dx > 0 ? 'right' : 'left';
            secondaryDir = dy > 0 ? 'down' : 'up';
        } else {
            primaryDir = dy > 0 ? 'down' : 'up';
            secondaryDir = dx > 0 ? 'right' : 'left';
        }

        // Try primary direction, then secondary, then random
        if (this.canMoveInDirection(primaryDir, maze)) {
            this.direction = primaryDir;
        } else if (this.canMoveInDirection(secondaryDir, maze)) {
            this.direction = secondaryDir;
        } else {
            // Pick a random valid direction
            this.pickRandomDirection(maze);
        }

        this.move(deltaTime, maze);
    }

    wander(deltaTime, maze) {
        // Change direction periodically or when hitting a wall
        if (this.directionChangeTimer >= this.directionChangeInterval) {
            this.directionChangeTimer = 0;
            this.directionChangeInterval = 0.5 + Math.random() * 1;
            this.pickRandomDirection(maze);
        }

        // Try to move
        const moved = this.move(deltaTime, maze);

        // If hit wall, pick new direction
        if (!moved) {
            this.pickRandomDirection(maze);
        }
    }

    move(deltaTime, maze) {
        let newX = this.x;
        let newY = this.y;

        const moveAmount = this.speed * deltaTime;

        switch (this.direction) {
            case 'up': newY -= moveAmount; break;
            case 'down': newY += moveAmount; break;
            case 'left': newX -= moveAmount; break;
            case 'right': newX += moveAmount; break;
        }

        // Check wall collision
        if (!Collision.entityWall(newX, newY, this.radius, maze)) {
            this.x = newX;
            this.y = newY;
            return true;
        }

        return false;
    }

    canMoveInDirection(dir, maze) {
        let testX = this.x;
        let testY = this.y;
        const testDist = this.radius + 5;

        switch (dir) {
            case 'up': testY -= testDist; break;
            case 'down': testY += testDist; break;
            case 'left': testX -= testDist; break;
            case 'right': testX += testDist; break;
        }

        return !Collision.entityWall(testX, testY, this.radius, maze);
    }

    pickRandomDirection(maze) {
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = directions.filter(d => this.canMoveInDirection(d, maze));

        if (validDirections.length > 0) {
            this.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
        }
    }

    tryShoot(player, maze) {
        // Calculate angle to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only shoot if player is within range
        if (distance > 400) return;

        // Determine shooting direction (4-directional)
        let shootDir;
        if (Math.abs(dx) > Math.abs(dy)) {
            shootDir = dx > 0 ? 'right' : 'left';
        } else {
            shootDir = dy > 0 ? 'down' : 'up';
        }

        // Spawn projectile
        let spawnX = this.x;
        let spawnY = this.y;
        const offset = this.radius + 5;

        switch (shootDir) {
            case 'up': spawnY -= offset; break;
            case 'down': spawnY += offset; break;
            case 'left': spawnX -= offset; break;
            case 'right': spawnX += offset; break;
        }

        const projectile = new Projectile(spawnX, spawnY, shootDir, null, this);
        ProjectileManager.add(projectile);

        this.shootCooldown = this.shootCooldownTime;
        Audio.play('alienShoot');
    }

    draw(ctx, time) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing animation
        const pulse = 1 + Math.sin(time * 5 + this.animationOffset) * 0.05;
        ctx.scale(pulse, pulse);

        // Main body (red alien)
        ctx.fillStyle = '#e74c3c';
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 10;

        // Body shape (rounded square)
        ctx.beginPath();
        ctx.roundRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2, 6);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-4, -2, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(4, -2, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (looking toward movement direction)
        ctx.fillStyle = '#000';
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        switch (this.direction) {
            case 'up': pupilOffsetY = -1; break;
            case 'down': pupilOffsetY = 1; break;
            case 'left': pupilOffsetX = -1; break;
            case 'right': pupilOffsetX = 1; break;
        }
        ctx.beginPath();
        ctx.arc(-4 + pupilOffsetX, -2 + pupilOffsetY, 2, 0, Math.PI * 2);
        ctx.arc(4 + pupilOffsetX, -2 + pupilOffsetY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyebrows
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -7);
        ctx.lineTo(-2, -5);
        ctx.moveTo(8, -7);
        ctx.lineTo(2, -5);
        ctx.stroke();

        // Mouth
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(0, 6, 4, 0, Math.PI);
        ctx.fill();

        // Teeth
        ctx.fillStyle = '#fff';
        ctx.fillRect(-3, 6, 2, 3);
        ctx.fillRect(1, 6, 2, 3);

        ctx.restore();
    }

    die() {
        this.alive = false;
        Audio.play('alienDeath');
    }

    // Check collision with player
    hitsPlayer(player) {
        if (!this.alive || !player.alive) return false;

        return Collision.circleCircle(
            this.x, this.y, this.radius,
            player.x, player.y, player.radius
        );
    }
}

// Alien Manager
const AlienManager = {
    aliens: [],
    spawnTimer: 0,
    spawnInterval: 4, // seconds between spawns
    maxAliens: 20,
    baseAlienCount: 6,
    aliensPerLevel: 3,
    speedMultiplier: 1,
    players: [], // For versus mode

    init(maze, level, player) {
        this.aliens = [];
        this.spawnTimer = 0;
        this.players = [player]; // Single player mode

        // Calculate aliens for this level
        const alienCount = this.baseAlienCount + (level - 1) * this.aliensPerLevel;
        this.maxAliens = alienCount + 5;
        this.speedMultiplier = 1 + (level - 1) * 0.15;

        // Spawn initial aliens
        for (let i = 0; i < alienCount; i++) {
            this.spawnAlien(maze, player);
        }
    },

    // Initialize for versus mode with split targeting
    initVersus(maze, level, player1, player2) {
        this.aliens = [];
        this.spawnTimer = 0;
        this.players = [player1, player2];

        // Calculate aliens for this level
        const alienCount = this.baseAlienCount + (level - 1) * this.aliensPerLevel;
        this.maxAliens = alienCount + 5;
        this.speedMultiplier = 1 + (level - 1) * 0.15;

        // Spawn initial aliens with split targeting
        for (let i = 0; i < alienCount; i++) {
            // Alternate targeting between players
            const targetPlayerId = (i % 2) + 1; // 1 or 2
            const targetPlayer = targetPlayerId === 1 ? player1 : player2;
            this.spawnAlienVersus(maze, player1, player2, targetPlayerId);
        }
    },

    spawnAlien(maze, player) {
        if (this.aliens.filter(a => a.alive).length >= this.maxAliens) return;

        // Get random position far from player
        const minDistance = maze.cellSize * 5;
        const cell = maze.getRandomPathCell(player, minDistance);

        if (cell) {
            // 50% chance of being a chaser
            const isChaser = Math.random() < 0.5;
            const alien = new Alien(cell.x, cell.y, isChaser);
            alien.speed *= this.speedMultiplier;
            this.aliens.push(alien);
        }
    },

    // Spawn alien for versus mode with assigned target
    spawnAlienVersus(maze, player1, player2, targetPlayerId) {
        if (this.aliens.filter(a => a.alive).length >= this.maxAliens) return;

        // Get random position far from both players
        const minDistance = maze.cellSize * 4;
        // Use the center point between players for distance check
        const centerPoint = {
            x: (player1.x + player2.x) / 2,
            y: (player1.y + player2.y) / 2
        };
        const cell = maze.getRandomPathCell(centerPoint, minDistance);

        if (cell) {
            const isChaser = Math.random() < 0.5;
            const alien = new Alien(cell.x, cell.y, isChaser);
            alien.speed *= this.speedMultiplier;
            alien.targetPlayerId = targetPlayerId;
            this.aliens.push(alien);
        }
    },

    update(deltaTime, maze, player) {
        // Update spawn timer
        this.spawnTimer += deltaTime;

        // Spawn new aliens periodically
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnAlien(maze, player);
        }

        // Update all aliens
        this.aliens.forEach(alien => alien.update(deltaTime, maze, player));

        // Check projectile hits - track who killed the alien
        const playerProjectiles = ProjectileManager.getPlayerProjectiles();
        this.aliens.forEach(alien => {
            if (!alien.alive) return;

            playerProjectiles.forEach(proj => {
                if (proj.active && proj.hits(alien)) {
                    alien.die();
                    proj.active = false;
                    // Track the kill
                    if (proj.ownerId && this.players[0]) {
                        this.players[0].aliensKilled++;
                    }
                }
            });
        });
    },

    // Update for versus mode with two players
    updateVersus(deltaTime, maze, player1, player2) {
        // Update spawn timer
        this.spawnTimer += deltaTime;

        // Spawn new aliens periodically
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            // Alternate target for new spawns
            const targetId = Math.random() < 0.5 ? 1 : 2;
            this.spawnAlienVersus(maze, player1, player2, targetId);
        }

        // Update all aliens - each alien targets their assigned player
        this.aliens.forEach(alien => {
            if (!alien.alive) return;

            // Determine which player to target
            let targetPlayer;
            if (alien.targetPlayerId === 1) {
                targetPlayer = player1.alive ? player1 : player2;
            } else {
                targetPlayer = player2.alive ? player2 : player1;
            }

            // Update with target player
            alien.update(deltaTime, maze, targetPlayer);
        });

        // Check player projectile hits on aliens - one hit kills
        const playerProjectiles = ProjectileManager.getPlayerProjectiles();
        this.aliens.forEach(alien => {
            if (!alien.alive) return;

            playerProjectiles.forEach(proj => {
                if (proj.active && proj.hits(alien)) {
                    // Spawn coin at alien's location before killing it
                    CoinManager.spawnCoin(alien.x, alien.y);
                    alien.die();
                    proj.active = false;
                    // Track who killed the alien
                    if (proj.ownerId === 1) {
                        player1.aliensKilled++;
                    } else if (proj.ownerId === 2) {
                        player2.aliensKilled++;
                    }
                }
            });
        });
    },

    draw(ctx, time) {
        this.aliens.forEach(alien => alien.draw(ctx, time));
    },

    checkPlayerCollision(player) {
        for (const alien of this.aliens) {
            if (alien.hitsPlayer(player)) {
                return true;
            }
        }
        return false;
    },

    // Returns the alien that is colliding with the player (for elimination)
    getCollidingAlien(player) {
        for (const alien of this.aliens) {
            if (alien.hitsPlayer(player)) {
                return alien;
            }
        }
        return null;
    },

    clear() {
        this.aliens = [];
        this.spawnTimer = 0;
    }
};
