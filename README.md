# career-intelligence-platform

Career Intelligence Platform is a minimalist, low-risk SaaS platform that uses Generative AI (OpenAI, Gemini) to create LinkedIn-optimized content and delivers it securely via a Telegram Bot. It is built to prioritize safety by relying on manual pre-filling/posting, completely avoiding LinkedIn API rate limits or ban risks.

## Features
- **Dark Theme UI**: Clean, minimalist, "Claude".
- **Supabase Auth**: Secure user authentication and dashboard protection.
- **Generative AI Toggle**: Choose between OpenAI (GPT-4o) and Google Gemini for your post generation.
- **Telegram Push Delivery**: Instead of automating the risky LinkedIn API, posts are sent directly to your phone via Telegram for 1-click manual posting.

## Tech Stack
- Next.js (App Router)
- Supabase (PostgreSQL & Auth)
- Tailwind CSS v4 + shadcn/ui
- Vitest & Playwright (Testing)

## Getting Started

1. Copy `.env.example` to `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
2. Fill in your environment variables:
   - \`NEXT_PUBLIC_SUPABASE_URL\` and \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - \`OPENAI_API_KEY\` and/or \`GEMINI_API_KEY\`
3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Run Unit Tests:
   \`\`\`bash
   npx vitest run
   \`\`\`
