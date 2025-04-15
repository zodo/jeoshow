Telegram Mini App version of the popular game Jeopardy built using the Cloudflare stack, including Workers, KV, Durable Objects, R2, and Pages. The game supports question packs from the [SIGame by Vladimir Khil](https://vladimirkhil.com/si/game)

Telegram bot: [@jeoshow_bot](https://t.me/jeoshow_bot)
A working version is available at: [https://jeoshow.220400.xyz/](https://jeoshow.220400.xyz/)

# Jeoshow

Своя Игра в минималистичном виде для использования в Telegram.

## Project Structure

### shared

Contains shared TypeScript models.

### tail-worker

Logs collector for sending data to Betterstack.

### engine

Backend running on Cloudflare Durable Object, containing the game logic. It is implemented as a finite state machine and uses Durable Object alarms for interactivity. Provides a WebSocket interface for client interaction.

### frontend

Game client running on Cloudflare Pages. Built with Svelte and Tailwind CSS. It can operate both in a browser and as a Telegram Mini App. Includes the interface and code for loading game packs and processing messages from Telegram.

# Differences from the SIGame web version

Link to the original: [https://sigame.vladimirkhil.com/](https://sigame.vladimirkhil.com/)

This version is minimalist and optimized for mobile use within Telegram.

# Local Development

1. Setup Cloudflare Wrangler
2. Create a file frontend/.env with the following content:

```
PUBLIC_ENGINE_URL=http://localhost:8787
PUBLIC_ENGINE_WEBSOCKET_URL=ws://localhost:8787
PUBLIC_FRONTEND_ROOT_URL=http://localhost:5173
TELEGRAM_BOT_TOKEN=<token>/test
TELEGRAM_BOT_API_SECRET_TOKEN=<random-string>
PUBLIC_POSTGHOG_API_KEY=<posthog-key>

```

3. Install dependencies and start the development server:

```

cd engine && pnpm install && cd ..
cd frontend && pnpm install && cd ..
cd tail-worker && pnpm install && cd ..
pnpm dev

```

# Deployment

1. Update `engine/wrangle.toml`
1. Create a file `frontend/.env.production` with appropriate values:
1. Deploy with `pnpm deploy`
