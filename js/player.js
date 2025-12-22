// Player Class - Camouflage Army Man
class Player {
    // Color schemes for different players
    static COLOR_SCHEMES = {
        1: { // Player 1 - Olive Green
            body: '#4a6741',
            camo1: '#3d5c3c',
            camo2: '#5a7a51',
            helmet: '#3d5c3c'
        },
        2: { // Player 2 - Navy Blue
            body: '#264d8a',
            camo1: '#1e3f66',
            camo2: '#3a6bb8',
            helmet: '#1e3f66'
        }
    };

    constructor(x, y, playerId = 1) {
        this.x = x;
        this.y = y;
        this.playerId = playerId;
        this.colorScheme = Player.COLOR_SCHEMES[playerId] || Player.COLOR_SCHEMES[1];
        this.radius = 12;
        this.speed = 150; // pixels per second
        this.direction = 'right'; // facing direction
        this.shootCooldown = 0;
        this.shootCooldownTime = 0.25; // seconds between shots
        this.invincible = false;
        this.invincibleTime = 0;
        this.invincibleDuration = 2; // seconds of invincibility after respawn
        this.lives = 3;
        this.alive = true;
        // Versus mode properties
        this.hitsTaken = 0; // Track hits for versus mode (3 hits = death)
        this.coinsCollected = 0; // Track coins for versus mode
        // Destructible blocks - 1 per level
        this.blocksDestroyedThisLevel = 0;
    }

    update(deltaTime, maze) {
        if (!this.alive) return;

        // Update invincibility
        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }

        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        // Get movement input based on player ID
        const movement = Input.getMovementVectorForPlayer(this.playerId);

        // Update facing direction based on movement
        if (movement.dx !== 0 || movement.dy !== 0) {
            if (Math.abs(movement.dx) > Math.abs(movement.dy)) {
                this.direction = movement.dx > 0 ? 'right' : 'left';
            } else {
                this.direction = movement.dy > 0 ? 'down' : 'up';
            }
        }

        // Calculate new position
        let newX = this.x + movement.dx * this.speed * deltaTime;
        let newY = this.y + movement.dy * this.speed * deltaTime;

        // Corner assistance - helps player slide around corners smoothly
        const assistStrength = this.speed * deltaTime * 0.8;
        const cellSize = maze.cellSize;

        // Check wall collisions with corner assistance
        let movedX = false;
        let movedY = false;

        if (movement.dx !== 0) {
            if (!Collision.entityWall(newX, this.y, this.radius, maze)) {
                this.x = newX;
                movedX = true;
            } else {
                // Try corner assistance - nudge vertically to slide around
                const cellY = Math.floor(this.y / cellSize);
                const cellCenterY = (cellY + 0.5) * cellSize;
                const offsetY = this.y - cellCenterY;

                // If we're slightly off-center, nudge toward center to slide around corner
                if (Math.abs(offsetY) > 2 && Math.abs(offsetY) < cellSize * 0.6) {
                    const nudge = offsetY > 0 ? -assistStrength : assistStrength;
                    if (!Collision.entityWall(this.x, this.y + nudge, this.radius, maze)) {
                        this.y += nudge;
                        // Try moving again after nudge
                        if (!Collision.entityWall(newX, this.y, this.radius, maze)) {
                            this.x = newX;
                            movedX = true;
                        }
                    }
                }
            }
        }

        if (movement.dy !== 0) {
            if (!Collision.entityWall(this.x, newY, this.radius, maze)) {
                this.y = newY;
                movedY = true;
            } else {
                // Try corner assistance - nudge horizontally to slide around
                const cellX = Math.floor(this.x / cellSize);
                const cellCenterX = (cellX + 0.5) * cellSize;
                const offsetX = this.x - cellCenterX;

                // If we're slightly off-center, nudge toward center to slide around corner
                if (Math.abs(offsetX) > 2 && Math.abs(offsetX) < cellSize * 0.6) {
                    const nudge = offsetX > 0 ? -assistStrength : assistStrength;
                    if (!Collision.entityWall(this.x + nudge, this.y, this.radius, maze)) {
                        this.x += nudge;
                        // Try moving again after nudge
                        if (!Collision.entityWall(this.x, newY, this.radius, maze)) {
                            this.y = newY;
                            movedY = true;
                        }
                    }
                }
            }
        }

        // Handle shooting - use shift keys for versus mode, space for legacy
        if ((Input.isShootPressed(this.playerId) || Input.wasJustPressed('Space')) && this.shootCooldown <= 0) {
            this.shoot();
        }
    }

    shoot() {
        if (this.shootCooldown > 0) return;

        // Calculate projectile spawn position (in front of player)
        let spawnX = this.x;
        let spawnY = this.y;
        const offset = this.radius + 5;

        switch (this.direction) {
            case 'up':
                spawnY -= offset;
                break;
            case 'down':
                spawnY += offset;
                break;
            case 'left':
                spawnX -= offset;
                break;
            case 'right':
                spawnX += offset;
                break;
        }

        const projectile = new Projectile(spawnX, spawnY, this.direction, this.playerId);
        ProjectileManager.add(projectile);
        this.shootCooldown = this.shootCooldownTime;

        Audio.play('shoot');
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();

        // Flicker when invincible
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Translate to player position and rotate based on direction
        ctx.translate(this.x, this.y);

        let rotation = 0;
        switch (this.direction) {
            case 'up': rotation = -Math.PI / 2; break;
            case 'down': rotation = Math.PI / 2; break;
            case 'left': rotation = Math.PI; break;
            case 'right': rotation = 0; break;
        }
        ctx.rotate(rotation);

        // Draw camouflage body (oval)
        ctx.fillStyle = this.colorScheme.body;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Camouflage pattern
        ctx.fillStyle = this.colorScheme.camo1;
        ctx.beginPath();
        ctx.ellipse(-3, -3, 4, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, 2, 3, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colorScheme.camo2;
        ctx.beginPath();
        ctx.ellipse(0, 4, 3, 2, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = this.colorScheme.helmet;
        ctx.beginPath();
        ctx.arc(0, -2, 7, Math.PI, 0);
        ctx.fill();

        // Gun
        ctx.fillStyle = '#333';
        ctx.fillRect(8, -2, 12, 4);

        // Gun barrel
        ctx.fillStyle = '#222';
        ctx.fillRect(18, -1, 4, 2);

        // Gun handle
        ctx.fillStyle = '#5a3d2b';
        ctx.fillRect(6, 2, 6, 4);

        ctx.restore();
    }

    takeDamage() {
        if (this.invincible || !this.alive) return false;

        this.lives--;
        Audio.play('playerHit');

        if (this.lives <= 0) {
            this.alive = false;
            return true; // Player is dead (game over)
        }

        // Respawn with invincibility
        this.invincible = true;
        this.invincibleTime = this.invincibleDuration;
        return false;
    }

    respawn(maze) {
        // Spawn at random position
        const spawnPos = maze.getRandomPathCell();
        this.x = spawnPos.x;
        this.y = spawnPos.y;
        this.direction = 'right';
        this.invincible = true;
        this.invincibleTime = this.invincibleDuration;
        this.alive = true;
    }

    reset(maze) {
        // Position will be set by caller (random spawn)
        this.direction = 'right';
        this.lives = 3;
        this.alive = true;
        this.invincible = true;
        this.invincibleTime = this.invincibleDuration;
        this.shootCooldown = 0;
        this.hitsTaken = 0;
        this.coinsCollected = 0;
        this.blocksDestroyedThisLevel = 0;
    }

    // Versus mode: Take a hit from another player (2 hits = death)
    // Returns true if player died from this hit
    takeVersusHit() {
        if (this.invincible || !this.alive) return false;

        this.hitsTaken++;
        Audio.play('playerHit');

        if (this.hitsTaken >= 2) {
            // Player is killed - lose a life
            this.hitsTaken = 0;
            this.lives--;

            if (this.lives <= 0) {
                this.alive = false;
                return true; // Player eliminated
            }

            // Respawn with invincibility (handled by game.js)
            return true; // Died but has lives left
        }

        // Hit but not dead - brief invincibility
        this.invincible = true;
        this.invincibleTime = 0.5; // Short invincibility after hit
        return false;
    }

    // Versus mode: Instant death from alien hit or collision
    // Returns true always (since it's instant death)
    takeInstantDeath() {
        if (this.invincible || !this.alive) return false;

        Audio.play('playerHit');
        this.hitsTaken = 0;
        this.lives--;

        if (this.lives <= 0) {
            this.alive = false;
            return true; // Player eliminated
        }

        // Died but has lives left
        return true;
    }

    // Reset hits (called on respawn)
    resetHits() {
        this.hitsTaken = 0;
    }

    // Respawn at a specific position (for versus mode)
    respawnAt(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'right';
        this.invincible = true;
        this.invincibleTime = this.invincibleDuration;
        this.alive = true;
        this.hitsTaken = 0;
    }
}
