# PourPrep

AI training kits for seasonal bar staff. Bar owners paste their menu, cocktail specs, and house policies; PourPrep's AI turns them into a training guide, spec flashcards, and a graded quiz for new hires.

**Live:** https://pourprep-nine.vercel.app

## Stack
- Next.js (App Router) on Vercel
- Neon Postgres for accounts and saved kits (tables are created automatically)
- Anthropic API for the AI training-kit generator
- Stripe Checkout for the $29/month Pro plan

## Environment variables (set in Vercel → Settings → Environment Variables)
| Name | Required | What it is |
|---|---|---|
| `DATABASE_URL` | yes | Added automatically when you connect Neon from Vercel → Storage |
| `ANTHROPIC_API_KEY` | yes | console.anthropic.com → API Keys |
| `STRIPE_SECRET_KEY` | yes | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | optional | Signing secret for the `/api/stripe/webhook` endpoint |
| `STRIPE_PRICE_CENTS` | optional | Monthly price in cents (default 2900; set 100 for the $1 live test) |

Never commit real keys. `.env*` files are git-ignored.

## Demo account
`demo@demo.com` / `password123!` — created automatically with full Pro access. Visit `/api/health` after a deploy to create it immediately and check which environment variables are set.
