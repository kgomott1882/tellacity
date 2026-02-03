This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment: logos

Business logos (when not manually uploaded) are resolved via [Logo.dev](https://logo.dev). Set this in `.env.local` so logos show on category, business, and search pages:

```bash
NEXT_PUBLIC_LOGO_DEV_TOKEN=your_logo_dev_publishable_key
```

Get a publishable key at [logo.dev](https://logo.dev). Without this variable, only manually uploaded logos will appear.

**Logos checklist**

1. **Set** `NEXT_PUBLIC_LOGO_DEV_TOKEN` in `.env.local` (publishable key from [logo.dev](https://logo.dev)).
2. **Restart** the dev server after changing env vars.
3. **Verify** token: open [http://localhost:3000/api/test-logo](http://localhost:3000/api/test-logo) — `token_exists` should be `true` and `sample_logo_url` should be a URL with `?token=...`.
4. **DB (optional)** Run `docs/sql-backfill-website-display-domain.sql` in Supabase so `website_display` has clean domains; category RPC uses this for Logo.dev URLs.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
