// Maze Generator using Recursive Backtracking
class Maze {
    constructor(cols, rows, cellSize) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = cellSize;
        this.grid = [];
        this.width = cols * cellSize;
        this.height = rows * cellSize;

        // Track wall hits for destructible blocks
        this.wallHits = {}; // key: "col,row", value: hit count

        // Generate the maze
        this.generate();
    }

    generate() {
        // Initialize grid with all walls
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = 1; // 1 = wall
            }
        }

        // Start recursive backtracking from (1, 1)
        this.carve(1, 1);

        // Ensure start and exit areas are clear
        this.clearStartArea();
        this.clearExitArea();
    }

    carve(x, y) {
        this.grid[y][x] = 0; // 0 = path

        // Directions: up, right, down, left (moving by 2 to leave walls between paths)
        const directions = [
            { dx: 0, dy: -2 },
            { dx: 2, dy: 0 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 }
        ];

        // Shuffle directions randomly
        this.shuffle(directions);

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            // Check if new position is within bounds and is a wall
            if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1) {
                if (this.grid[ny][nx] === 1) {
                    // Carve through the wall between current and new position
                    this.grid[y + dir.dy / 2][x + dir.dx / 2] = 0;
                    this.carve(nx, ny);
                }
            }
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    clearStartArea() {
        // Clear a small area around the start position (top-left)
        for (let row = 1; row <= 2; row++) {
            for (let col = 1; col <= 2; col++) {
                if (row < this.rows && col < this.cols) {
                    this.grid[row][col] = 0;
                }
            }
        }
    }

    clearExitArea() {
        // Clear a small area around the exit position (bottom-right)
        for (let row = this.rows - 3; row < this.rows - 1; row++) {
            for (let col = this.cols - 3; col < this.cols - 1; col++) {
                if (row >= 0 && col >= 0) {
                    this.grid[row][col] = 0;
                }
            }
        }
    }

    isWall(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return true; // Out of bounds is treated as wall
        }
        return this.grid[row][col] === 1;
    }

    isPath(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return false;
        }
        return this.grid[row][col] === 0;
    }

    getStartPosition() {
        return {
            x: 1.5 * this.cellSize,
            y: 1.5 * this.cellSize
        };
    }

    // Player 2 start position (bottom-right, opposite corner from P1)
    getPlayer2StartPosition() {
        return {
            x: (this.cols - 2.5) * this.cellSize,
            y: (this.rows - 2.5) * this.cellSize
        };
    }

    getExitPosition() {
        return {
            x: (this.cols - 2) * this.cellSize,
            y: (this.rows - 2) * this.cellSize
        };
    }

    getExitBounds() {
        const exit = this.getExitPosition();
        return {
            x: exit.x - this.cellSize / 2,
            y: exit.y - this.cellSize / 2,
            width: this.cellSize,
            height: this.cellSize
        };
    }

    // Get all path cells for spawning entities
    getPathCells() {
        const paths = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 0) {
                    paths.push({
                        col,
                        row,
                        x: (col + 0.5) * this.cellSize,
                        y: (row + 0.5) * this.cellSize
                    });
                }
            }
        }
        return paths;
    }

    // Get random path cell at minimum distance from a point
    getRandomPathCell(minDistanceFrom = null, minDistance = 0) {
        const paths = this.getPathCells();

        if (minDistanceFrom) {
            const validPaths = paths.filter(p => {
                const dx = p.x - minDistanceFrom.x;
                const dy = p.y - minDistanceFrom.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return dist >= minDistance;
            });

            if (validPaths.length > 0) {
                return validPaths[Math.floor(Math.random() * validPaths.length)];
            }
        }

        return paths[Math.floor(Math.random() * paths.length)];
    }

    // Check if position is near the exit
    isNearExit(x, y, threshold = 50) {
        const exit = this.getExitPosition();
        const dx = x - exit.x;
        const dy = y - exit.y;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
    }

    // Hit a wall by player - returns true if wall was destroyed (10 hits)
    hitWall(col, row) {
        if (!this.isWall(col, row)) return false;

        // Don't allow destroying border walls
        if (col === 0 || col === this.cols - 1 || row === 0 || row === this.rows - 1) {
            return false;
        }

        const key = `${col},${row}`;
        this.wallHits[key] = (this.wallHits[key] || 0) + 1;

        if (this.wallHits[key] >= 10) {
            this.destroyWall(col, row);
            return true;
        }
        return false;
    }

    // Hit a wall by alien laser - destroys after 5 hits (no limit on blocks)
    hitWallAlien(col, row) {
        if (!this.isWall(col, row)) return false;

        // Don't allow destroying border walls
        if (col === 0 || col === this.cols - 1 || row === 0 || row === this.rows - 1) {
            return false;
        }

        const key = `alien_${col},${row}`;
        this.wallHits[key] = (this.wallHits[key] || 0) + 1;

        if (this.wallHits[key] >= 5) {
            this.destroyWall(col, row);
            Audio.play('alienDeath'); // Sound for alien-destroyed block
            return true;
        }
        return false;
    }

    // Get hit count for a wall (for visual feedback)
    getWallHits(col, row) {
        const key = `${col},${row}`;
        return this.wallHits[key] || 0;
    }

    // Destroy a wall (turn it into a path)
    destroyWall(col, row) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.grid[row][col] = 0; // 0 = path
        }
    }

    // Get wall cell at a pixel position
    getWallCellAt(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        if (this.isWall(col, row)) {
            return { col, row };
        }
        return null;
    }
}
