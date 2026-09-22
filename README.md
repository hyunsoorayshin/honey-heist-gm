# Honey Heist GM Helper (unofficial)

A small Electron + React + TypeScript desktop app for running a one-page,
bear-themed heist RPG at the table. It gives the GM a single screen with a
player roster, a per-character editor with the game's two opposed stats, a
shared map you can drop and drag tokens on, and one-click rolls on the game's
random tables.

**The game's text is not included.** Every table the app rolls on is read at
runtime from a `tables.json` file that you fill in yourself from your own copy
of the rulebook. Out of the box the app runs on obvious placeholders
(`"Descriptor 1"`, `"Prize 3"`, and so on).

## Why I built it

I wanted a lightweight GM screen for running a one-page RPG with a group:
something that tracked each player's two-stat balance so I could see at a
glance who was drifting toward either end, gave everyone a shared map with
draggable elements instead of scraps of paper, and let me roll on the setup
tables without flipping back to the sheet mid-scene. Built on personal time as
a weekend project.

## What this is not

- Not official. This is an unofficial, fan-made helper. It is not affiliated
  with, endorsed by, or connected to the game's author or publisher.
- Not a copy of the game. No rules text, table entries, character-sheet
  content, artwork or maps from the game are included in this repository. You
  need your own legally obtained copy of the rulebook to fill in the tables.
- Not affiliated with any school, academy or employer.

*Honey Heist* is written by Grant Howitt and published by Rowan, Rook and
Decard; it is sold through their site and itch.io. Please support the author by
buying it there.

## Setup

```sh
npm install
npm run dev        # launches Electron with hot reload
npm run typecheck  # tsc over main/preload and renderer projects
npm run build      # electron-vite production build into out/
```

### Providing your tables

1. Start the app once. A notice bar at the top says it is running on
   placeholder tables and shows the exact path it expects; the "Show folder"
   button opens that location. It is `tables.json` inside Electron's user-data
   directory for the app (on macOS that is
   `~/Library/Application Support/honey-heist-gm/tables.json`).
2. Copy [`src/shared/tables.example.json`](src/shared/tables.example.json) to
   that path and replace every placeholder with the corresponding entry from
   your rulebook. Keep the row order the same as the book so the row numbers
   line up with the dice.
3. Press "Reload" in the notice bar (or restart). The notice disappears once a
   valid user file is loaded. If the file has a problem, the notice says what
   is wrong and the app keeps running on placeholders.

The file shape is:

| Key                  | Type                                    | Notes                                              |
| -------------------- | --------------------------------------- | -------------------------------------------------- |
| `title`              | string                                  | Window / header title                              |
| `statLabels`         | `{ bear, criminal }`                    | Display names for the two stats                    |
| `statusLabels`       | `{ active, betrayed, "lost-it" }`       | Display names for the three character states       |
| `descriptors`        | string[]                                | Character table                                    |
| `roles`              | string[]                                | Character table                                    |
| `bearTypes`          | `{ name, skill, icon? }[]`              | Character table; `icon` is an optional emoji       |
| `hats`               | string[]                                | Character table                                    |
| `organizerTraits`    | string[]                                | Scenario table                                     |
| `locationAdjectives` | string[]                                | Scenario table                                     |
| `locationNouns`      | string[]                                | Scenario table                                     |
| `prizes`             | string[]                                | Scenario table                                     |
| `securityFeatures`   | string[]                                | Scenario table (rolled twice)                      |
| `twists`             | string[]                                | Scenario table                                     |

Every list must have at least one entry; its length decides the die that is
rolled for it. `tables.json` is git-ignored so a filled-in copy cannot be
committed by accident.

### Map image

Use "Change Map…" on the map pane to pick any image from disk. No map is
bundled.

## Project layout

```
src/main/       Electron main process: window, persistence, tables loader
src/preload/    contextBridge API exposed to the renderer as window.gm
src/renderer/   React UI (roster, character editor, map, scenario bar)
src/shared/     Types, pure reducer, rules constants, tables schema/validator
```

Game state autosaves to `state.json` in the same user-data directory.

## Author

Hyunsoo Ray Shin (Ray)

## License

The code is released under the MIT License; see [LICENSE](LICENSE). The
license covers this repository's source only, not the game or any of its
material.
