# Production Schema Alignment Report

**Migration file:** `supabase/align_production_schema_with_beta.sql`  
**Source of truth:** Beta tables (`beta_customers`, `beta_orders`, `beta_film_rolls`, `beta_payments`) from `fix_beta_schema.sql`  
**Target:** Production tables (`customers`, `orders`, `film_rolls`, `payments`, `admin_users`)

---

## Safe to run

**Yes** — for Supabase SQL Editor on the **production** project.

- Uses `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
- Does **not** drop tables or delete data
- Does **not** rename columns
- Backfills only `NULL` values with safe defaults
- Idempotent (safe to re-run)

**Caveats:**

1. Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel/production env for reliable order submit and admin writes.
2. If `orders.status` is still type `order_status` (enum) from an old schema, new status strings work once enum values are added (script includes `Pending Payment Confirmation`, `Developing+Scanning`). Existing enum column is **not** converted to `text`.
3. Run on **production only**, not the beta project.

---

## Missing production tables (before migration)

| Table | Status |
|-------|--------|
| `customers` | Usually exists (from `schema.sql`) |
| `orders` | Usually exists |
| `film_rolls` | Usually exists |
| `payments` | **Often missing** — created by this migration |
| `admin_users` | Usually exists (app uses env password; table kept for parity) |
| `pricing_settings` | **Often missing** — created for admin pricing UI |

**Note:** `beta_admin_users` is referenced in app config but has no column definition in beta SQL migrations. Production `admin_users` already matches `schema.sql` — no column changes required.

---

## Missing production columns (added by migration)

### `customers` (vs `beta_customers`)

| Column | Action |
|--------|--------|
| `allow_social_share` | ADD |
| `instagram_username` | ADD |
| `updated_at` | ADD |
| `email` nullable | ALTER (drop NOT NULL) |

### `orders` (vs `beta_orders`)

| Column | Action |
|--------|--------|
| `payment_status` | ADD |
| `payment_method` | ADD |
| `payment_slip_url` | ADD |
| `payment_slip_file_name` | ADD |
| `film_delivery_method` | ADD |
| `return_method` | ADD |
| `recipient_name` | ADD |
| `recipient_phone` | ADD |
| `film_total` | ADD |
| `shipping_fee` | ADD |
| `discount_amount` | ADD |
| `updated_at` | ADD |

*(Base columns `order_code`, `customer_id`, `status`, `file_delivery`, `film_return`, `address`, `notes`, `total_price`, `created_at` assumed present from legacy schema.)*

### `film_rolls` (vs `beta_film_rolls`)

| Column | Action |
|--------|--------|
| `brand` | ADD |
| `brand_other` | ADD |
| `stock` | ADD |
| `stock_other` | ADD |
| `bw_developer` | ADD |
| `condition` | ADD |
| `push_pull_enabled` | ADD |
| `push_pull_type` | ADD |
| `push_pull_stops` | ADD |
| `experimental_film` | ADD |
| `created_at` | ADD |
| `updated_at` | ADD |

### `payments` (vs `beta_payments`)

Entire table created if missing, then all columns ensured:

`id`, `order_id`, `method`, `status`, `slip_url`, `slip_file_name`, `bank_name`, `account_number`, `account_name`, `amount`, `confirmed_at`, `created_at`, `updated_at`

---

## Indexes & constraints added

- `orders_order_code_idx` (unique)
- `orders_customer_id_idx`
- `orders_created_at_idx`
- `film_rolls_order_id_idx`
- `payments_order_id_unique` (unique)
- `payments_order_id_idx`
- FK: `orders.customer_id` → `customers.id`
- FK: `film_rolls.order_id` → `orders.id`
- FK: `payments.order_id` → `orders.id`

Wrong FKs pointing at `beta_*` tables are dropped if present.

---

## RLS policies added

| Table | Policies |
|-------|----------|
| `customers` | `prod_anon_select_customers`, `prod_anon_insert_customers` |
| `orders` | `prod_anon_select_orders`, `prod_anon_insert_orders`, `prod_anon_update_orders` |
| `film_rolls` | `prod_anon_select_film_rolls`, `prod_anon_insert_film_rolls` |
| `payments` | `prod_anon_select_payments`, `prod_anon_insert_payments`, `prod_anon_update_payments` |
| `pricing_settings` | `prod_anon_select_pricing` |

RLS enabled on all five tables.

---

## Grants added

```sql
GRANT SELECT, INSERT ON customers, orders, film_rolls, payments TO anon;
GRANT UPDATE ON orders, payments TO anon;
GRANT SELECT ON pricing_settings TO anon;
GRANT UPDATE ON orders TO authenticated;
```

---

## Realtime

- Adds `public.orders` to `supabase_realtime` publication (Track Order live updates)

---

## Post-migration checklist

After running the SQL on production:

1. Set `NEXT_PUBLIC_APP_ENV=production` (or omit beta flag)
2. Set all Supabase env vars including `SUPABASE_SERVICE_ROLE_KEY`
3. Test customer order submit → confirmation → track order
4. Test admin login → view order → confirm payment → update status
5. Confirm no PostgREST “column not found” errors in logs

---

## App columns reference (`getOrderSelect`)

The migration aligns production with every field read/written by:

- `lib/db/mappers.ts` — `draftToDbPayload`, `mapOrder`, `getOrderSelect`
- `lib/db/orders.ts` — create, update status, confirm payment
