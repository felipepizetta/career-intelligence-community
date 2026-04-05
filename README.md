# career-intelligence-platform

Career Intelligence Platform is a minimalist, low-risk SaaS platform that uses Generative AI (Google Gemini) to create LinkedIn-optimized content and delivers it securely via a Telegram Bot. It is built to prioritize safety by relying on manual pre-filling/posting, completely avoiding LinkedIn API rate limits or ban risks.

## Features
- **Dark Theme UI**: Clean, minimalist dashboard designed for high focus.
- **Supabase Auth**: Secure user authentication and protected workflows.
- **Generative AI Integration**: Powered by native Google Gemini API to generate your content contextually.
- **Telegram Push Delivery**: Deliver generated posts directly to your phone via Telegram for safe, 1-click manual posting—avoiding risky LinkedIn API automation limits.
- **News Extraction & Article Analysis**: Paste any URL to let the AI summarize headlines or dive deep into the full article to generate uniquely tailored professional insights.
- **Advanced Post Configuration**: Control the length of your posts and select from various styles including Top Voice, Case Study, Storytelling, Contrarian, Curation, and Opinion.
- **Automations & Auto-Posting**: Built-in secure CRON-compatible endpoints for automated content generation and pushing to Telegram.
- **Rate Limiting**: Integrated Upstash Redis to protect the AI generation endpoints from abuse.

## Tech Stack
- Next.js (App Router)
- Supabase (PostgreSQL & Auth)
- Tailwind CSS v4 + shadcn/ui
- Upstash Redis (Rate Limiting)
- Vitest & Playwright (Testing)

## Getting Started

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in your environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for secure backend service operations)
   - `GEMINI_API_KEY`
   - `TELEGRAM_BOT_TOKEN` (for mobile delivery)
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (optional, for Rate Limiting)
   - `CRON_SECRET` (optional, for Automations protection)
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Run Unit Tests:
   ```bash
   npx vitest run
   ```
5. Run End-to-End Tests:
   ```bash
   npx playwright test
   ```
