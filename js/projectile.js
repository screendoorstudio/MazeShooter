// Projectile (Laser) Class
class Projectile {
    constructor(x, y, direction, isPlayerProjectile = true) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 'up', 'down', 'left', 'right'
        this.isPlayerProjectile = isPlayerProjectile;
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

    update(deltaTime, maze) {
        if (!this.active) return;

        // Move projectile
        const newX = this.x + this.vx * deltaTime;
        const newY = this.y + this.vy * deltaTime;

        // Check wall collision
        if (Collision.entityWall(newX, newY, this.radius, maze)) {
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
        if (this.isPlayerProjectile) {
            ctx.fillStyle = '#00bfff'; // Blue for player
            ctx.shadowColor = '#00bfff';
        } else {
            ctx.fillStyle = '#9b59b6'; // Purple for aliens
            ctx.shadowColor = '#9b59b6';
        }
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

    update(deltaTime, maze) {
        this.projectiles.forEach(p => p.update(deltaTime, maze));
        // Remove inactive projectiles
        this.projectiles = this.projectiles.filter(p => p.active);
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

    clear() {
        this.projectiles = [];
    }
};
