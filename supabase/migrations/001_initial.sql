-- Kings table: every person who has ever held the throne
CREATE TABLE kings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle           TEXT NOT NULL,
  network          TEXT NOT NULL,
  price_paid       INTEGER NOT NULL,          -- in cents
  paypal_order_id  TEXT NOT NULL UNIQUE,      -- idempotency key
  reigned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dethroned_at     TIMESTAMPTZ                -- NULL while still reigning
);

CREATE INDEX idx_kings_reigned_at ON kings (reigned_at DESC);
CREATE INDEX idx_kings_handle ON kings (handle);

-- State table: single row representing the live site state
CREATE TABLE state (
  id               INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_king_id  UUID REFERENCES kings(id),
  current_price    INTEGER NOT NULL DEFAULT 100,  -- starts at $1 (100 cents)
  total_kings      INTEGER NOT NULL DEFAULT 0
);

-- Seed the single state row
INSERT INTO state (id, current_price, total_kings) VALUES (1, 100, 0);

-- RLS: public read, no direct writes (all writes via RPC)
ALTER TABLE kings ENABLE ROW LEVEL SECURITY;
ALTER TABLE state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kings_public_read" ON kings FOR SELECT USING (true);
CREATE POLICY "state_public_read" ON state FOR SELECT USING (true);

-- Enable Realtime on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE state;
ALTER PUBLICATION supabase_realtime ADD TABLE kings;

-- RPC: atomically crown a new king (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION crown_new_king(
  p_handle          TEXT,
  p_network         TEXT,
  p_price_paid      INTEGER,
  p_paypal_order_id TEXT
) RETURNS UUID AS $$
DECLARE
  v_new_king_id    UUID;
  v_existing_id    UUID;
BEGIN
  -- Serialize concurrent calls to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext('crown_new_king'));

  -- Idempotency: if this order was already processed, return existing king UUID
  SELECT id INTO v_existing_id FROM kings WHERE paypal_order_id = p_paypal_order_id;
  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  BEGIN
    -- Dethrone current king
    UPDATE kings
    SET dethroned_at = NOW()
    WHERE id = (SELECT current_king_id FROM state WHERE id = 1)
      AND dethroned_at IS NULL;

    -- Insert new king
    INSERT INTO kings (handle, network, price_paid, paypal_order_id, reigned_at)
    VALUES (p_handle, p_network, p_price_paid, p_paypal_order_id, NOW())
    RETURNING id INTO v_new_king_id;

    -- Update state atomically
    UPDATE state SET
      current_king_id = v_new_king_id,
      current_price   = current_price + 100,    -- +$1 in cents
      total_kings     = total_kings + 1
    WHERE id = 1;

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'crown_new_king failed: %', SQLERRM;
  END;

  RETURN v_new_king_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: compute all stats in one query (SECURITY INVOKER — reads public tables only)
CREATE OR REPLACE FUNCTION get_stats()
RETURNS JSON AS $$
DECLARE
  v_longest      JSON;
  v_spender      JSON;
  v_fastest      JSON;
  v_attempts     JSON;
BEGIN
  -- Longest completed reign
  SELECT json_build_object(
    'handle', handle,
    'network', network,
    'duration_seconds', EXTRACT(EPOCH FROM (dethroned_at - reigned_at))::int
  ) INTO v_longest
  FROM kings
  WHERE dethroned_at IS NOT NULL
  ORDER BY (dethroned_at - reigned_at) DESC
  LIMIT 1;

  -- Biggest spender (sum by handle+network, show top pair)
  SELECT json_build_object(
    'handle', handle,
    'network', network,
    'total_cents', SUM(price_paid)
  ) INTO v_spender
  FROM kings
  GROUP BY handle, network
  ORDER BY SUM(price_paid) DESC
  LIMIT 1;

  -- Fastest dethroned (shortest completed reign)
  SELECT json_build_object(
    'handle', handle,
    'network', network,
    'duration_seconds', EXTRACT(EPOCH FROM (dethroned_at - reigned_at))::int
  ) INTO v_fastest
  FROM kings
  WHERE dethroned_at IS NOT NULL
  ORDER BY (dethroned_at - reigned_at) ASC
  LIMIT 1;

  -- Most attempts (by handle, any network — shows most recent network used)
  SELECT json_build_object(
    'handle', k_outer.handle,
    'network', (
      SELECT k_inner.network
      FROM kings k_inner
      WHERE k_inner.handle = k_outer.handle
      ORDER BY k_inner.reigned_at DESC
      LIMIT 1
    ),
    'count', COUNT(*)
  ) INTO v_attempts
  FROM kings k_outer
  GROUP BY k_outer.handle
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  RETURN json_build_object(
    'longest_reign',     COALESCE(v_longest,  'null'::json),
    'biggest_spender',   COALESCE(v_spender,  'null'::json),
    'fastest_dethroned', COALESCE(v_fastest,  'null'::json),
    'most_attempts',     COALESCE(v_attempts, 'null'::json)
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;
