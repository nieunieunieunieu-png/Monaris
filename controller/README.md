# Monaris PC Controller

This is a SECOND small Discord bot application. It stays online while the main
Monaris process is offline so `/moboss` can start Monaris locally.

## Setup (Windows)

1. In the Discord Developer Portal create a **new** application and bot,
   separate from Monaris. Reset/copy its bot token privately.
2. Invite that new bot to the same Discord server using OAuth2 URL Generator:
   scopes `bot` and `applications.commands`. It only needs the normal bot
   permission to be present; no Administrator permission is required.
3. Create `E:\Monaris\controller\.env` (do not commit it), with one line:
   `MONARIS_CONTROLLER_TOKEN=YOUR_NEW_CONTROLLER_BOT_TOKEN`
4. Keep `E:\Monaris\.env` with `DISCORD_GUILD_ID`, `ADMIN_USER_ID` and the
   original `DISCORD_TOKEN`. NEVER use the same token for the two bots.
5. In CMD: `cd /d E:\Monaris` then `npm install` and `npm run controller`.
6. Leave this Controller CMD running. In Discord, choose the controller's
   `/moboss` command. It launches `node start.js` inside `E:\Monaris`.
7. Monaris's own `/tatbot` stops just the main bot. Controller stays online
   so `/moboss` can start it again.

## Limitations and safety

- This can only start the main bot if the PC is ON and Controller is running.
- If the PC is off/asleep or Controller has stopped, no Discord command can
  reach it. Consider Windows Task Scheduler to start Controller at login.
- Controller tracks ONLY the process it launches. Stop any manually launched
  `npm start` instance before using `/moboss` to avoid duplicate bot sessions.
- It cannot run arbitrary shell commands, and only the configured owner ID
  may invoke `/moboss`.
- Main bot settings, Google keys and data remain in local `.env`,
  `MonarisKeys`, and `data`. Never upload those folders to a public repository.
- Controller does not auto-restart Monaris after `/tatbot`.
