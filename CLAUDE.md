# Maze Shooter

A web-based maze shooter game built with HTML5 Canvas and vanilla JavaScript.

**Live Game:** https://maze-shooter.vercel.app/

## Game Overview

Navigate through randomly generated mazes, collect coins, shoot aliens, and reach the exit. The game features single-player and two-player alternating turn modes.

### Controls
| Key | Action |
|-----|--------|
| Arrow Keys | Move (up, down, left, right) |
| Spacebar | Shoot laser / Start game / Continue |
| R | Restart after game over |
| 1 | Select single player mode |
| 2 | Select two player mode |

### Gameplay
- **Objective:** Navigate the maze to reach the green EXIT while collecting coins and avoiding/shooting aliens
- **Lives:** 3 lives per game - lose a life when touched by an alien or hit by a purple laser
- **Coins:** Collect coins for star ratings (1-3 stars based on percentage collected)
- **Levels:** Each level has a new random maze with more aliens that move faster
- **Two-Player Mode:** Players take turns - highest combined score (level × 10 + stars) wins

### Star Rating
- 0-33% coins = 1 star
- 34-66% coins = 2 stars
- 67-100% coins = 3 stars

## Technical Architecture

### File Structure
```
MazeShooter/
├── index.html          # Main HTML with canvas and HUD elements
├── css/
│   └── style.css       # Game styling, HUD layout, dark theme
├── js/
│   ├── game.js         # Main game loop, state management, game modes
│   ├── maze.js         # Maze generation (recursive backtracking algorithm)
│   ├── player.js       # Player class with movement, shooting, corner assistance
│   ├── alien.js        # Alien class with chaser/wanderer AI, AlienManager
│   ├── projectile.js   # Laser projectiles, ProjectileManager
│   ├── coin.js         # Coin class, CoinManager with star calculation
│   ├── collision.js    # Collision detection utilities
│   ├── input.js        # Keyboard input handler
│   ├── renderer.js     # Canvas rendering, all screen drawing functions
│   └── audio.js        # Web Audio API sound effects
├── ideas-images/
│   └── mazeimage.png   # Reference maze image used for design
├── .gitignore
└── CLAUDE.md           # This file
```

### Key Technical Details

#### Maze Generation (`maze.js`)
- Uses **recursive backtracking** algorithm
- Grid size: 21×21 cells (odd numbers required for algorithm)
- Creates passages by "carving" through walls
- Guarantees solvable maze with single solution path
- Start position: top-left area
- Exit position: bottom-right area

#### Player Movement (`player.js`)
- Smooth pixel-by-pixel movement (not grid-snapping)
- **Corner assistance:** When player is blocked at a corner but close to a corridor opening, automatically nudges them toward the opening for smoother navigation
- Invincibility frames after taking damage (2 seconds)
- Direction tracked for shooting (fires in facing direction)

#### Alien AI (`alien.js`)
- Two behavior types (50/50 split):
  - **Chasers:** Pathfind toward player, choosing directions that reduce distance
  - **Wanderers:** Move randomly, change direction at intervals or when hitting walls
- Aliens shoot purple lasers toward player when within range (300px)
- Spawn at random maze locations with minimum distance from player
- Per level: starts with 3 aliens, +2 each level, speed increases 15% per level

#### Collision Detection (`collision.js`)
- Circle-circle collision for entity interactions
- Circle-rectangle collision for wall checks
- Entities treated as circles with radius property

#### Audio (`audio.js`)
- Procedurally generated sounds using Web Audio API
- No external audio files required
- Sounds: shoot, coin pickup, player hit, alien death, alien shoot, level complete, game over

#### Game States (`game.js`)
- `modeSelect` - Choose 1 or 2 players
- `start` - Instructions screen
- `playing` - Active gameplay
- `levelComplete` - Show stars earned
- `switchPlayer` - Two-player mode transition
- `gameOver` - Single player end
- `finalResults` - Two-player comparison and winner

## Development History

### Session 1 (Initial Build)
1. Designed game mechanics based on user requirements
2. Created maze generation with recursive backtracking
3. Built player with camouflage army man sprite
4. Implemented red aliens with dual AI (chasers + wanderers)
5. Added blue player lasers and purple alien lasers
6. Created coin collection system with star ratings
7. Built multi-level progression with increasing difficulty
8. Added Web Audio API sound effects
9. Created HUD with lives, coins, level, stars display

### Session 1 (Enhancements)
10. Added **corner assistance** for smoother movement around corners
11. Implemented **two-player alternating turn mode**
12. Set up Git repository
13. Deployed to Vercel at https://maze-shooter.vercel.app/

## Future Development

### Planned: Simultaneous Two-Player Mode
A mode where two players play at the same time on the same maze, competing or cooperating.

**Considerations for implementation:**
- Second set of controls (WASD + different shoot key?)
- Different player colors/sprites to distinguish players
- Decide: cooperative (shared lives?) or competitive (race to exit?)
- Camera: will need to handle if players separate in a scrolling view, or keep maze small enough to fit both
- Friendly fire on/off option?
- Separate coin tracking or shared?

### Other Potential Enhancements
- Power-ups (speed boost, shield, rapid fire, freeze aliens)
- Different alien types with unique behaviors
- Boss battles every N levels
- High score persistence (localStorage)
- Mobile touch controls
- Different maze themes/skins
- Difficulty settings

## Running Locally

Simply open `index.html` in a web browser. No build process or server required.

```bash
open index.html
# or
python -m http.server 8000  # then visit localhost:8000
```

## Deployment

The game is deployed on Vercel and automatically deploys when changes are pushed to the `main` branch on GitHub.

**Repository:** https://github.com/screendoorstudio/MazeShooter
**Live URL:** https://maze-shooter.vercel.app/

To deploy updates:
```bash
git add -A
git commit -m "Description of changes"
git push
```
Vercel will automatically rebuild and deploy within ~30 seconds.
