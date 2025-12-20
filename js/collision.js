// Collision Detection Utilities
const Collision = {
    // Check if two circles overlap
    circleCircle(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    },

    // Check if a circle overlaps with a rectangle
    circleRect(cx, cy, radius, rx, ry, rw, rh) {
        // Find closest point on rectangle to circle center
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));

        // Calculate distance from circle center to closest point
        const dx = cx - closestX;
        const dy = cy - closestY;

        return (dx * dx + dy * dy) < (radius * radius);
    },

    // Check if a point is inside a rectangle
    pointRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    // Check if entity (circle) collides with any wall in the maze
    entityWall(x, y, radius, maze) {
        const cellSize = maze.cellSize;

        // Check cells around the entity
        const startCol = Math.floor((x - radius) / cellSize);
        const endCol = Math.floor((x + radius) / cellSize);
        const startRow = Math.floor((y - radius) / cellSize);
        const endRow = Math.floor((y + radius) / cellSize);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (maze.isWall(col, row)) {
                    // Check collision with this wall cell
                    if (this.circleRect(x, y, radius,
                        col * cellSize, row * cellSize, cellSize, cellSize)) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    // Get the cell coordinates for a position
    getCellCoords(x, y, cellSize) {
        return {
            col: Math.floor(x / cellSize),
            row: Math.floor(y / cellSize)
        };
    },

    // Check line-of-sight between two points (for laser collision)
    lineWall(x1, y1, x2, y2, maze) {
        const cellSize = maze.cellSize;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / (cellSize / 4));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + dx * t;
            const y = y1 + dy * t;

            const col = Math.floor(x / cellSize);
            const row = Math.floor(y / cellSize);

            if (maze.isWall(col, row)) {
                return { hit: true, x, y };
            }
        }
        return { hit: false, x: x2, y: y2 };
    }
};
