// Projectile (Laser) Class
class Projectile {
    // Laser colors per owner
    static COLORS = {
        1: '#00bfff',     // Player 1 - Blue
        2: '#ff6b35',     // Player 2 - Orange
        alien: '#9b59b6'  // Aliens - Purple
    };

    // ownerId: 1 = Player 1, 2 = Player 2, null = Alien
    // sourceAlien: reference to alien that fired this projectile (for elimination on hit)
    constructor(x, y, direction, ownerId = null, sourceAlien = null) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 'up', 'down', 'left', 'right'
        this.ownerId = ownerId; // null for aliens, 1 or 2 for players
        this.isPlayerProjectile = ownerId !== null; // backwards compatibility
        this.sourceAlien = sourceAlien; // Reference to alien that fired (for elimination)
        this.speed = 400; // pixels per second
        this.radius = 4;
        this.length = 15;
        this.active = true;

        // Set velocity based on direction
        this.vx = 0;
        this.vy = 0;

        switch (direction) {
            case 'up':
                this.vy = -this.speed;
                break;
            case 'down':
                this.vy = this.speed;
                break;
            case 'left':
                this.vx = -this.speed;
                break;
            case 'right':
                this.vx = this.speed;
                break;
        }
    }

    update(deltaTime, maze, player = null, player2 = null) {
        if (!this.active) return;

        // Move projectile
        const newX = this.x + this.vx * deltaTime;
        const newY = this.y + this.vy * deltaTime;

        // Check wall collision
        if (Collision.entityWall(newX, newY, this.radius, maze)) {
            // If this is a player projectile, try to damage the wall
            if (this.isPlayerProjectile && this.ownerId) {
                const wallCell = maze.getWallCellAt(newX, newY);
                if (wallCell) {
                    // Get the player who fired this
                    const shooter = this.ownerId === 1 ? player : player2;
                    if (shooter && shooter.blocksDestroyedThisLevel < 1) {
                        const destroyed = maze.hitWall(wallCell.col, wallCell.row);
                        if (destroyed) {
                            shooter.blocksDestroyedThisLevel++;
                            Audio.play('levelComplete'); // Satisfying sound for block destruction
                        }
                    }
                }
            }
            this.active = false;
            return;
        }

        this.x = newX;
        this.y = newY;

        // Deactivate if out of bounds
        if (this.x < 0 || this.x > maze.width || this.y < 0 || this.y > maze.height) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Color based on who fired it
        let color;
        if (this.ownerId === 1) {
            color = Projectile.COLORS[1]; // Blue for Player 1
        } else if (this.ownerId === 2) {
            color = Projectile.COLORS[2]; // Orange for Player 2
        } else {
            color = Projectile.COLORS.alien; // Purple for aliens
        }
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;

        // Draw laser beam
        ctx.beginPath();
        if (this.direction === 'up' || this.direction === 'down') {
            ctx.roundRect(this.x - this.radius, this.y - this.length / 2, this.radius * 2, this.length, this.radius);
        } else {
            ctx.roundRect(this.x - this.length / 2, this.y - this.radius, this.length, this.radius * 2, this.radius);
        }
        ctx.fill();

        ctx.restore();
    }

    // Check collision with an entity
    hits(entity) {
        return Collision.circleCircle(
            this.x, this.y, this.radius,
            entity.x, entity.y, entity.radius || entity.size / 2
        );
    }
}

// Projectile Manager
const ProjectileManager = {
    projectiles: [],

    add(projectile) {
        this.projectiles.push(projectile);
    },

    update(deltaTime, maze, player = null, player2 = null) {
        this.projectiles.forEach(p => p.update(deltaTime, maze, player, player2));
        // Remove inactive projectiles
        this.projectiles = this.projectiles.filter(p => p.active);
    },

    // Check for collisions between player and alien projectiles
    // Player lasers destroy alien lasers on contact
    checkProjectileCollisions() {
        const playerProjectiles = this.projectiles.filter(p => p.active && p.isPlayerProjectile);
        const alienProjectiles = this.projectiles.filter(p => p.active && !p.isPlayerProjectile);

        // Use larger collision radius since projectiles move fast and could pass through each other
        const collisionRadius = 12; // More generous than the visual radius of 4

        for (const playerProj of playerProjectiles) {
            for (const alienProj of alienProjectiles) {
                const dx = playerProj.x - alienProj.x;
                const dy = playerProj.y - alienProj.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < collisionRadius * 2) {
                    // Both projectiles are destroyed
                    playerProj.active = false;
                    alienProj.active = false;
                }
            }
        }
    },

    draw(ctx) {
        this.projectiles.forEach(p => p.draw(ctx));
    },

    getPlayerProjectiles() {
        return this.projectiles.filter(p => p.isPlayerProjectile && p.active);
    },

    getAlienProjectiles() {
        return this.projectiles.filter(p => !p.isPlayerProjectile && p.active);
    },

    // Get projectiles from a specific player
    getProjectilesFromPlayer(playerId) {
        return this.projectiles.filter(p => p.ownerId === playerId && p.active);
    },

    // Get projectiles that can hit a specific player (from other player or aliens)
    getProjectilesTargeting(playerId) {
        return this.projectiles.filter(p => p.active && p.ownerId !== playerId);
    },

    clear() {
        this.projectiles = [];
    }
};
