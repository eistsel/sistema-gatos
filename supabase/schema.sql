-- =============================================================
-- Schema: Sistema de Gastos Personales
-- =============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  currency TEXT DEFAULT 'PEN',
  timezone TEXT DEFAULT 'America/Lima',
  month_start_day INT DEFAULT 1,
  profile_type TEXT DEFAULT 'empleado',
  main_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, currency, timezone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'PEN', 'America/Lima');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. ACCOUNTS
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('ahorro','corriente','efectivo','tarjeta_credito')) NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  include_in_net BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own accounts"
  ON accounts FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('INGRESO','GASTO')) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  note TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. BUDGETS
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL,
  spent_amount DECIMAL(12,2) DEFAULT 0,
  UNIQUE(user_id, category, month, year)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own budgets"
  ON budgets FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. SAVINGS GOALS
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  monthly_contribution DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own goals"
  ON savings_goals FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================
-- 6. TRIGGER: auto-update budget spent_amount from transactions
-- =============================================================

CREATE OR REPLACE FUNCTION public.update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  t_month INT;
  t_year INT;
  t_amount DECIMAL(12,2);
  t_user_id UUID;
  t_category TEXT;
BEGIN
  -- Only process GASTO transactions
  IF TG_OP = 'INSERT' AND NEW.type = 'GASTO' THEN
    t_month := EXTRACT(MONTH FROM NEW.date);
    t_year := EXTRACT(YEAR FROM NEW.date);
    UPDATE public.budgets
    SET spent_amount = spent_amount + NEW.amount
    WHERE user_id = NEW.user_id
      AND category = NEW.category
      AND month = t_month
      AND year = t_year;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old amount if it was GASTO
    IF OLD.type = 'GASTO' THEN
      UPDATE public.budgets
      SET spent_amount = GREATEST(spent_amount - OLD.amount, 0)
      WHERE user_id = OLD.user_id
        AND category = OLD.category
        AND month = EXTRACT(MONTH FROM OLD.date)
        AND year = EXTRACT(YEAR FROM OLD.date);
    END IF;
    -- Add new amount if it is GASTO
    IF NEW.type = 'GASTO' THEN
      UPDATE public.budgets
      SET spent_amount = spent_amount + NEW.amount
      WHERE user_id = NEW.user_id
        AND category = NEW.category
        AND month = EXTRACT(MONTH FROM NEW.date)
        AND year = EXTRACT(YEAR FROM NEW.date);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' AND OLD.type = 'GASTO' THEN
    UPDATE public.budgets
    SET spent_amount = GREATEST(spent_amount - OLD.amount, 0)
    WHERE user_id = OLD.user_id
      AND category = OLD.category
      AND month = EXTRACT(MONTH FROM OLD.date)
      AND year = EXTRACT(YEAR FROM OLD.date);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_transaction_budget_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_budget_spent();

-- =============================================================
-- 7. STORAGE: receipts bucket
-- =============================================================
-- Run in Supabase SQL Editor after creating the bucket:
--   1. Create bucket named "receipts" (public) via Dashboard
--   2. Then run:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);
--
-- CREATE POLICY "Users can upload own receipts"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "Users can read own receipts"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "Users can delete own receipts"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
