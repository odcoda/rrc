# Robot Roll Call authoring notes

- Each robot is a single HTML file in `robots/` and should import `../shared/rrc-shell.js`, `../shared/rrc-openrouter.js`, and `../shared/rrc-auth.js`.
- Include `<div data-rrc-auth></div>` and call `initRobotShell()` so the shared auth bar renders on every page.
- Use `createChatCompletion()` and `extractChatMessage()` from `shared/rrc-openrouter.js` for LLM calls.
- Gate interaction on auth state with `getAuthState()` and `onAuthChange()`; disable submit when disconnected.
- Add a roster card to `index.html` for new robots and keep descriptions short.
- Keep robots simple, single-file, and ASCII-only unless there is a strong reason otherwise.
- Log changes in `log.md` with ISO dates.
