-- Run this entire script in your Supabase SQL Editor
-- It will create all the tables, set up default data, and enable public access

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Front Desk',
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Users
INSERT INTO public.users (id, name, role, username, password) VALUES 
  (1, 'Admin', 'Admin', 'admin', 'admin'),
  (2, 'Front Desk', 'Front Desk', 'desk', 'desk'),
  (3, 'Maddy', 'Admin', 'maddy', 'CIS123'),
  (4, 'Pavan', 'Admin', 'pavan', 'Pjillella123')
ON CONFLICT (username) DO NOTHING;

-- 2. Create Items Table
CREATE TABLE IF NOT EXISTS public.items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  "minStock" INTEGER DEFAULT 5,
  "purchaseRate" NUMERIC DEFAULT 0,
  "staffRate" NUMERIC DEFAULT 0,
  "guestRate" NUMERIC DEFAULT 0,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Logs Table
CREATE TABLE IF NOT EXISTS public.logs (
  id BIGINT PRIMARY KEY,
  "batchId" BIGINT,
  "itemId" INTEGER REFERENCES public.items(id) ON DELETE SET NULL,
  "itemName" TEXT NOT NULL,
  "itemCategory" TEXT,
  quantity INTEGER NOT NULL,
  "rateType" TEXT,
  "unitRate" NUMERIC,
  "totalAmount" NUMERIC,
  "purchaseRate" NUMERIC,
  "purchaseCost" NUMERIC,
  "paymentMethod" TEXT,
  "roomNumber" TEXT,
  notes TEXT,
  "staffId" INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  "staffName" TEXT,
  shift TEXT,
  "shiftLabel" TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id SERIAL PRIMARY KEY,
  "hotelName" TEXT DEFAULT 'Country Inn & Suites',
  "hotelAddress" TEXT DEFAULT '123 Luxury Ave, Suite 100',
  categories JSONB DEFAULT '["Drinks", "Snacks", "Essentials", "Medicines"]'::JSONB,
  notifications JSONB DEFAULT '{"lowStock": true, "outOfStock": true, "shiftReport": false}'::JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Settings
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Disable Row Level Security (RLS) for testing so you don't run into permission errors
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
