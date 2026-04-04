-- ChillFin Database Schema
-- Run this in your Supabase SQL editor at:
-- https://supabase.com/dashboard/project/nwylocmilmlteuzpkobs/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- Users (keyed by Firebase UID)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  college TEXT,
  monthly_pocket_money NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Transactions (income + expenses)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT NOT NULL,
  type TEXT CHECK (type IN ('income','expense')) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'misc',
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_firebase_uid ON transactions(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);

-- ─────────────────────────────────────────
-- Budget Plans (monthly 50/30/20)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  needs_amount NUMERIC(10,2) DEFAULT 0,
  wants_amount NUMERIC(10,2) DEFAULT 0,
  savings_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(firebase_uid, month, year)
);

-- ─────────────────────────────────────────
-- Savings Goals (Goal Vaults)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC(10,2) NOT NULL,
  saved_amount NUMERIC(10,2) DEFAULT 0,
  target_date DATE,
  emoji TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_firebase_uid ON goals(firebase_uid);

-- ─────────────────────────────────────────
-- EMI Calculations history
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emi_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT NOT NULL,
  item_name TEXT,
  principal NUMERIC(10,2),
  interest_rate NUMERIC(5,2),
  tenure_months INTEGER,
  monthly_emi NUMERIC(10,2),
  total_cost NUMERIC(10,2),
  affordability_score INTEGER CHECK (affordability_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emi_firebase_uid ON emi_calculations(firebase_uid);

-- ─────────────────────────────────────────
-- Row Level Security (RLS)
-- NOTE: We use Firebase UIDs. Disable RLS for MVP and
-- rely on firebase_uid filtering in queries.
-- Enable proper RLS before going to production.
-- ─────────────────────────────────────────
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE emi_calculations DISABLE ROW LEVEL SECURITY;
