-- Fix PATCH /api/admin/orders/[id] — allow server-side status updates via anon key.
-- Run once in Supabase → SQL Editor.

-- 1) Ensure order_status enum includes all admin statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'order_status' AND e.enumlabel = 'Developing+Scanning'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'order_status' AND e.enumlabel = 'Developing'
    ) THEN
      UPDATE orders SET status = 'Developing'::order_status WHERE status::text = 'Scanning';
      ALTER TYPE order_status RENAME VALUE 'Developing' TO 'Developing+Scanning';
    ELSE
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'Developing+Scanning';
    END IF;
  END IF;
END $$;

-- 2) Table-level grant (safe if already granted)
GRANT UPDATE ON TABLE public.orders TO anon;
GRANT UPDATE ON TABLE public.orders TO authenticated;

-- 3) RLS policy so anon UPDATE is not silently blocked
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_update_orders" ON public.orders;

CREATE POLICY "anon_update_orders"
  ON public.orders
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
