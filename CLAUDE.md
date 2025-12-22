# Maze Shooter

> **MCP Servers Available:** This project inherits GitHub, Vercel, Supabase, and Resend MCP integrations from the parent Jake folder. See `/Jake/CLAUDE.md` for details.

A web-based maze shooter game built with HTML5 Canvas and vanilla JavaScript.

**Live Game:** https://maze-shooter.vercel.app/

## Game Overview

Navigate through randomly generated mazes, collect coins while shooting aliens. The game features three modes:
- **Single Player** - Collect all coins, survive as long as you can
- **Two-Player Alternating** - Players take turns when hit, highest score wins
- **Versus Mode** - Two players compete simultaneously for coins

### Controls

#### Menu Controls
| Key | Action |
|-----|--------|
| 1 | Select single player mode |
| 2 | Select two-player alternating mode |
| 3 | Select versus mode |
| Space | Start game / Continue / Return to main menu |
| R | Restart same game mode after game over |

#### Gameplay Controls
| Player | Movement | Shoot |
|--------|----------|-------|
| Player 1 | Arrow Keys | Right Shift (or Space in non-versus) |
| Player 2 | WASD | Left Shift |

### Game Modes

#### Single Player
- Collect ALL coins to complete each level
- 3 lives - lose a life when hit by alien or purple laser
- Random spawn position each level and on respawn
- Aliens increase in number and speed each level
- Stats tracked: Coins collected, Aliens killed, Levels completed

#### Two-Player Alternating
- Players take turns on the **same maze layout** (shared per level)
- When hit, control switches to the other player
- Each player has 3 lives independently
- Random spawn position each level and on respawn
- When a player loses all lives, they're eliminated
- Winner determined by: (levels × 100) + coins + (aliens × 5)
- "PLAYER ONE/TWO READY" message shown before each turn

#### Versus Mode (Simultaneous)
- Both players on the same maze at the same time
- **Objective:** Collect the most coins before all coins are gone
- **Random Spawns:** Both players spawn at random locations each level
- **Random Respawns:** After losing a life, respawn at random location (150px from other player)
- **Player-vs-Player Combat:** 2 hits = lose a life
- **Killing Aliens:** One hit from any player kills an alien, spawning a coin
- **Alien Combat:** Alien hit or projectile = instant life loss, alien is eliminated
- **Laser Defense:** Player lasers destroy alien lasers on contact
- Each player has 3 lives for the entire game (not per level)
- **Bonus Life:** Earn a free life every 50 coins collected
- **Game Over:** When either player loses all lives, the game ends immediately
- Half the aliens target Player 1, half target Player 2
- Stats tracked per player: Coins, Aliens killed, Levels
- "PLAYERS READY" message shown before game starts

### Visual Identification
- **Player 1:** Olive green camouflage, blue lasers
- **Player 2:** Navy blue camouflage, orange lasers
- **Aliens:** Red, purple lasers

### Destructible Blocks (All Modes)
- **Player destruction:** Shoot a wall 10 times to destroy it
  - Each player can destroy ONE block per level
  - Ability resets when advancing to next level
  - Border walls cannot be destroyed
- **Alien destruction:** Alien lasers destroy walls after 5 hits
  - No limit on how many blocks aliens can destroy
  - Creates dynamic gameplay as aliens open up the maze

## Technical Architecture

### File Structure
```
MazeShooter/
├── index.html          # Main HTML with canvas and HUD elements
├── css/
│   └── style.css       # Game styling, HUD layout, dark theme
├── js/
│   ├── game.js         # Main game loop, state management, all game modes
│   ├── maze.js         # Maze generation (recursive backtracking algorithm)
│   ├── player.js       # Player class with movement, shooting, color schemes
│   ├── alien.js        # Alien class with chaser/wanderer AI, split targeting
│   ├── projectile.js   # Laser projectiles with owner tracking (P1/P2/alien)
│   ├── coin.js         # Coin class, per-player collection tracking
│   ├── collision.js    # Collision detection utilities
│   ├── input.js        # Keyboard input handler (arrows, WASD, shift keys)
│   ├── renderer.js     # Canvas rendering, HUD, all screen overlays
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
- `getRandomPathCell()` provides random spawn locations for versus mode

#### Player System (`player.js`)
- Smooth pixel-by-pixel movement (not grid-snapping)
- **Corner assistance:** When player is blocked at a corner but close to a corridor opening, automatically nudges them toward the opening
- Invincibility frames after taking damage (2 seconds normal, 0.5 seconds between hits in versus)
- Direction tracked for shooting (fires in facing direction)
- **Color schemes:** Static property defines olive green (P1) and navy blue (P2) palettes
- **Versus hit system:** 2 hits from other player = lose a life; alien hit = instant life loss
- `takeVersusHit()` for player-vs-player, `takeInstantDeath()` for alien damage
- Per-player coin tracking via `coinsCollected` property

#### Input System (`input.js`)
- Tracks continuous key state and single-press events separately
- **Player 1:** Arrow keys for movement, Right Shift to shoot
- **Player 2:** WASD for movement, Left Shift to shoot
- Space bar works for shooting in non-versus modes (backwards compatibility)
- `getMovementVectorForPlayer(playerId)` returns direction based on player's keys
- `isShootPressed(playerId)` checks the correct shift key per player

#### Projectile System (`projectile.js`)
- `ownerId` property: `1` (P1), `2` (P2), or `null` (alien)
- Color based on owner: Blue (#00bfff) for P1, Orange (#ff6b35) for P2, Purple (#9b59b6) for aliens
- `getProjectilesTargeting(playerId)` returns projectiles that can hit a specific player
- `checkProjectileCollisions()` handles player lasers destroying alien lasers

#### Alien AI (`alien.js`)
- Two behavior types (50/50 split):
  - **Chasers:** Pathfind toward target player
  - **Wanderers:** Move randomly, change direction at intervals
- **Split targeting (versus mode):** Each alien assigned to target P1 or P2
  - Falls back to other player if assigned target is dead
- Aliens shoot toward their target player when within range (400px)
- Shoot cooldown: 1.5-2 seconds between shots
- Per level: starts with 6 aliens, +3 each level, max 20 aliens, speed increases 15% per level
- New aliens spawn every 4 seconds
- **Versus mode:** Aliens drop a coin when killed
- `getCollidingAlien(player)` returns alien for elimination on collision

#### Coin System (`coin.js`)
- `coinsPerPlayer` object tracks coins collected by each player
- `collectedBy` property on each coin records who picked it up
- `getWinner()` returns player with most coins (or null for tie)
- `updateVersus()` method checks collection for both players
- `spawnCoin(x, y)` dynamically spawns coins (used when aliens die)

#### Collision Detection (`collision.js`)
- Circle-circle collision for entity interactions
- Circle-rectangle collision for wall checks
- Entities treated as circles with radius property

#### Audio (`audio.js`)
- Procedurally generated sounds using Web Audio API
- No external audio files required
- Sounds: shoot, coin pickup, player hit, alien death, alien shoot, level complete, game over

#### Game States (`game.js`)
- `modeSelect` - Choose mode (1, 2, or 3)
- `start` - Instructions screen with "PLAYER READY" message
- `playing` - Active gameplay
- `levelComplete` - Show coins/aliens for level (non-versus)
- `versusComplete` - Show round winner and coin totals
- `versusGameOver` - Versus mode game over (player eliminated)
- `switchPlayer` - Two-player alternating mode transition
- `gameOver` - Single player end (shows coins, aliens, levels)
- `finalResults` - Two-player alternating comparison

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

### Session 2 (Gameplay Changes)
14. Changed level completion: collect ALL coins instead of reaching exit (removed exit door)
15. Two-player alternating mode: players now alternate turns when hit (not just at game over)
16. Each player maintains their own independent maze/game state

### Session 3 (Versus Mode)
17. Added **simultaneous two-player Versus Mode** (Press 3)
18. New controls: WASD for P2 movement, Shift keys for shooting
19. Player color schemes: olive green (P1) vs navy blue (P2)
20. Projectile ownership tracking with distinct laser colors
21. Per-player coin collection tracking
22. Player-vs-player combat: 3 hits to kill
23. Split alien targeting: half chase P1, half chase P2
24. Versus-specific HUD showing both players' lives and coins
25. Round completion screen with winner and running totals
26. **Bug fix:** Lives now persist across levels (3 lives per game, not per level)
27. **Bug fix:** Aliens persist in versus mode (cannot be killed by player projectiles)

### Session 4 (Combat Overhaul)
28. **Player lasers destroy alien lasers** - projectile-vs-projectile collision detection
29. **Alien hit = instant life + alien eliminated** - aliens die when they damage a player
30. **Player-vs-player: 2 hits to lose a life** (changed from 3)
31. **Bonus life at 50 coins** - earn free life every 50 coins collected (green flash + sound)
32. Added `takeInstantDeath()` method for alien damage, `getCollidingAlien()` for alien elimination
33. **Players can kill aliens** - one hit kills, spawns a coin at alien's location
34. Added `CoinManager.spawnCoin(x, y)` for dynamic coin spawning
35. **More aliens:** 6 base (was 3), +3 per level (was +2), max 20 (was 10)
36. **Faster alien shooting:** 1.5-2s cooldown (was 2-4s), 400px range (was 300px)
37. **Random spawn positions** - both players spawn randomly each level
38. **Random respawn** - after losing a life, respawn at random location (150px from other player)
39. **Game over on elimination** - game ends when either player loses all lives

### Session 5 (Stats & Destructible Blocks)
40. **Versus game over screen** - proper game over when player eliminated (was showing round complete)
41. **Game over navigation** - R restarts same mode, Space returns to main menu
42. **Bug fix:** Versus mode now fully resets on new game (lives, hits, coins)
43. **Destructible blocks** - shoot wall 10 times to destroy (1 block per player per level)
44. **Alien laser destruction** - aliens destroy blocks after 5 hits (no limit)
45. Added `hitWall()` and `hitWallAlien()` to Maze class
46. Added `blocksDestroyedThisLevel` tracking per player
47. **Same maze in alternating mode** - both players see identical maze layout per level
48. Added `levelMazes` object to store mazes per level
49. **Random spawns for all modes** - single player now spawns randomly too
50. **New stats system** - replaced stars with coins/aliens/levels
51. Updated all game over screens to show new stats
52. Winner scoring: (levels × 100) + coins + (aliens × 5)
53. HUD now shows aliens killed instead of stars
54. **Ready messages** - "PLAYER ONE/TWO READY" or "PLAYERS READY" before game
55. **State persistence fix** - blocksDestroyedThisLevel and aliensKilled saved when switching players

## Future Development

### Potential Enhancements
- Power-ups (speed boost, shield, rapid fire, freeze aliens)
- Different alien types with unique behaviors
- Boss battles every N levels
- High score persistence (localStorage)
- Mobile touch controls
- Different maze themes/skins
- Difficulty settings
- Cooperative mode (shared objective, shared lives?)
- Tournament/bracket mode for versus

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
