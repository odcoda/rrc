## 2026-05-31 handle private browser auth storage
hardened shared OpenRouter auth persistence:
- verify browser storage before starting PKCE sign-in
- fall back to per-tab session storage when local storage is blocked
- show an actionable error instead of claiming a failed token save worked

## 2026-05-31 add free story model alternatives
expanded the story extender dropdown:
- added free Venice Uncensored, gpt-oss-20b, and Gemma 4 26B options
- labeled free instruction-tuned fallbacks separately from cheap continuation models
- skipped DeepSeek because OpenRouter currently has no free DeepSeek route

## 2026-05-31 add story extender robot
added a plain story continuation page:
- sends editable tags and story text as one raw completion prompt with a 320-token cap
- offers random tags and a small set of low-cost open-weight continuation models
- added shared raw text-completion support and linked the robot from the roster

## 2026-05-30 customizable auth bar themes
made the shared auth bar configurable per robot without duplicating markup:
- added `initRobotShell({ copy, theme })` options for text, fonts, colors, buttons, and status dots
- gave each robot page a matching auth bar theme
- updated the template and authoring note with the configuration pattern

## 2026-03-24 add studio buddy robot
built a new creative support robot page:
- added studio-buddy.html with local project memory, plain-text notebook preview, streak tracking, and fresh-session buddy chat
- wired the robot into the roster
- kept auth gating on LLM chat while leaving local tracking usable without auth

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
