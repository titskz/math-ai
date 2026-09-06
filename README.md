# MultiMath AI

React + Vite frontend. Compares math solutions from four AI models via [OpenRouter](https://openrouter.ai): ChatGPT, DeepSeek, Claude, and Grok.

Upload a math problem image → get four step-by-step solutions side by side with consensus highlighting.

## Development

```sh
npm install
cp .env.example .env.local   # add your OpenRouter API key
npm run dev
npm run build
```

Get an API key at [openrouter.ai/keys](https://openrouter.ai/keys).

## GitHub Pages

1. Push this project to the `main` branch.
2. In **Settings → Secrets and variables → Actions**, add:
   - Name: `OPENROUTER_API_KEY`
   - Value: your OpenRouter key (`sk-or-v1-...`)
3. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
4. Push to `main` — the workflow builds and deploys `dist`.

> **Security note:** The API key is injected at build time and will be visible in the published JavaScript bundle. For a public repository, anyone can extract and use it. Consider rotating your key regularly and setting spending limits on OpenRouter. For production use, prefer a backend proxy (Cloudflare Worker) to keep the key secret.

Change the GitHub link in `src/components/Header.jsx` to your repository URL when available.

## How it works

- Image is converted to base64 in the browser and sent to OpenRouter vision models.
- Four models run in parallel; results appear as each completes.
- Per-provider retry works independently; replacing the image cancels pending requests.

Image selection supports PNG/JPG/WEBP up to 10 MB, drag/drop and clipboard paste. Theme, selected images and results remain in memory only. Copy requires a secure browser context (HTTPS or localhost).

## Models (OpenRouter)

| UI name  | Model ID |
|----------|----------|
| ChatGPT  | `openai/gpt-4o-mini` |
| DeepSeek | `deepseek/deepseek-v4-flash-vision-exp` |
| Claude   | `anthropic/claude-3.5-sonnet` |
| Grok     | `x-ai/grok-2-vision-1212` |

Edit `src/config/providers.js` to change models.
