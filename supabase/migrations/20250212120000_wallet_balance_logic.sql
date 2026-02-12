-- =============================================================================
-- WALLET BALANCE LOGIC: initial_balance + transaction-based calculation
-- =============================================================================
-- Saldo Awal (initial_balance) = user-editable base amount
-- Saldo Saat Ini (balance) = initial_balance + efek semua transaksi (dihitung)
-- =============================================================================

-- STEP 1: Add initial_balance column
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS initial_balance NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN wallets.initial_balance IS 'Saldo awal yang dapat dikoreksi user. Saldo saat ini (balance) dihitung dari initial_balance + transaksi.';

-- STEP 2: Backfill initial_balance for existing wallets
-- initial_balance = balance - net_transactions (agar balance tetap valid setelah migrasi)
DO $$
DECLARE
  r RECORD;
  v_income NUMERIC;
  v_expense NUMERIC;
  v_transfer_in NUMERIC;
  v_transfer_out NUMERIC;
  v_net NUMERIC;
  v_initial NUMERIC;
BEGIN
  FOR r IN SELECT id, balance FROM wallets
  LOOP
    SELECT COALESCE(SUM(amount), 0) INTO v_income
    FROM transactions
    WHERE source_wallet_id = r.id AND LOWER(type) = 'income';

    SELECT COALESCE(SUM(amount), 0) INTO v_expense
    FROM transactions
    WHERE source_wallet_id = r.id AND LOWER(type) = 'expense';

    SELECT COALESCE(SUM(amount), 0) INTO v_transfer_in
    FROM transactions
    WHERE destination_wallet_id = r.id AND LOWER(type) = 'transfer';

    SELECT COALESCE(SUM(amount), 0) INTO v_transfer_out
    FROM transactions
    WHERE source_wallet_id = r.id AND LOWER(type) = 'transfer';

    v_net := v_income - v_expense + v_transfer_in - v_transfer_out;
    v_initial := COALESCE(r.balance, 0) - v_net;

    UPDATE wallets SET initial_balance = GREATEST(0, v_initial) WHERE id = r.id;
  END LOOP;
END $$;

-- STEP 3: Create recalculate function
CREATE OR REPLACE FUNCTION recalculate_wallet_balance(p_wallet_id UUID)
RETURNS void AS $$
DECLARE
  v_initial NUMERIC;
  v_income NUMERIC;
  v_expense NUMERIC;
  v_transfer_in NUMERIC;
  v_transfer_out NUMERIC;
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(initial_balance, 0) INTO v_initial
  FROM wallets WHERE id = p_wallet_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_income
  FROM transactions
  WHERE source_wallet_id = p_wallet_id AND LOWER(type) = 'income';

  SELECT COALESCE(SUM(amount), 0) INTO v_expense
  FROM transactions
  WHERE source_wallet_id = p_wallet_id AND LOWER(type) = 'expense';

  SELECT COALESCE(SUM(amount), 0) INTO v_transfer_in
  FROM transactions
  WHERE destination_wallet_id = p_wallet_id AND LOWER(type) = 'transfer';

  SELECT COALESCE(SUM(amount), 0) INTO v_transfer_out
  FROM transactions
  WHERE source_wallet_id = p_wallet_id AND LOWER(type) = 'transfer';

  v_balance := v_initial + v_income - v_expense + v_transfer_in - v_transfer_out;

  UPDATE wallets SET balance = v_balance WHERE id = p_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Trigger on transactions (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION trigger_recalc_wallets_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_source_id UUID;
  v_dest_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_source_id := OLD.source_wallet_id;
    v_dest_id := OLD.destination_wallet_id;
  ELSE
    v_source_id := COALESCE(NEW.source_wallet_id, OLD.source_wallet_id);
    v_dest_id := COALESCE(NEW.destination_wallet_id, OLD.destination_wallet_id);
  END IF;

  IF v_source_id IS NOT NULL THEN
    PERFORM recalculate_wallet_balance(v_source_id);
  END IF;
  IF v_dest_id IS NOT NULL AND v_dest_id != v_source_id THEN
    PERFORM recalculate_wallet_balance(v_dest_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_recalc_wallets ON transactions;
CREATE TRIGGER trg_transactions_recalc_wallets
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_wallets_on_transaction();

-- STEP 5: Trigger on wallets (UPDATE initial_balance)
CREATE OR REPLACE FUNCTION trigger_recalc_wallet_on_initial_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.initial_balance IS DISTINCT FROM OLD.initial_balance THEN
    PERFORM recalculate_wallet_balance(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wallets_recalc_on_initial ON wallets;
CREATE TRIGGER trg_wallets_recalc_on_initial
  AFTER UPDATE OF initial_balance ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_wallet_on_initial_balance();

-- STEP 6: Trigger on wallet INSERT (set balance = initial_balance for new wallet)
CREATE OR REPLACE FUNCTION trigger_wallet_insert_set_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance := COALESCE(NEW.initial_balance, NEW.balance, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wallet_insert_balance ON wallets;
CREATE TRIGGER trg_wallet_insert_balance
  BEFORE INSERT ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_wallet_insert_set_balance();
