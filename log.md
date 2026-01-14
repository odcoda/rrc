## 2026-01-14 fix empathy game integration
rewrote empathy-game.html to use shared RRC modules:
- now uses shared auth (rrc:openrouter:tokens) instead of separate auth
- uses createChatCompletion/extractChatMessage from rrc-openrouter.js
- has data-rrc-auth bar via initRobotShell()
- added back link to roster
- kept unique purple gradient styling and game mechanics

## 2026-01-14 unique robot styling
gave each example robot a distinct visual personality:
- roll-call: stadium marquee theme with running lights, glowing text, typewriter output
- battery-forecast: retro CRT terminal with scanlines, green phosphor, ASCII battery gauge

## 2026-01-14 add empathy game robot
- rescued empathy-game.html from broken claude branch
- added to roster on index page
- deleted orphaned claude/llm-empathy-game-5OidE branch
- set main as default branch

## 2026-01-14 repo + pages setup
fixed incomplete GitHub setup:
- switched remote to HTTPS (SSH auth was failing)
- pushed main branch to origin
- enabled GitHub Pages serving from main branch root
Site live at https://odcoda.github.io/rrc/

## 2026-01-06 rrc scaffolding
set up shared OpenRouter auth, client helpers, and auth bar shell
built index plus roll-call robot and a template page
added site-wide styling for the roster and robot pages

## 2026-01-06 rrc test robot
added battery forecast test robot and linked it from the roster
documented authoring workflow in AGENTS.md
