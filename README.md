# Marla Film Lab

A responsive Next.js App Router application for guest film lab orders and a separated private admin system.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Admin Login

- Email: `admin@marlafilmlab.com`
- Password: `admin123`

## Notes

- Customer orders are guest-only and stored in `localStorage` for now.
- Admin routes use a mock `localStorage` session guard.
- Supabase-ready tables are in `supabase/schema.sql`.
