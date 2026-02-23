-- Crowded Barrel Payroll App — Database Schema
-- Run this in the Supabase SQL Editor

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'bartender',
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 15.00,
  tip_rate_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_coffee_worker BOOLEAN NOT NULL DEFAULT false,
  gusto_tips_only BOOLEAN NOT NULL DEFAULT false,
  wedding_hourly_rate NUMERIC(10,2) DEFAULT 30.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly payroll header
CREATE TABLE IF NOT EXISTS weekly_payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  toast_tips NUMERIC(10,2) NOT NULL DEFAULT 0,
  coffee_tips NUMERIC(10,2) NOT NULL DEFAULT 0,
  wedding_tips NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_pool NUMERIC(10,2) GENERATED ALWAYS AS (toast_tips + coffee_tips + wedding_tips) STORED,
  bar_tip_pool NUMERIC(10,2) NOT NULL DEFAULT 0,
  initial_tip_rate NUMERIC(10,4) NOT NULL DEFAULT 0,
  final_tip_rate NUMERIC(10,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Employee hours per week
CREATE TABLE IF NOT EXISTS employee_weekly_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id UUID NOT NULL REFERENCES weekly_payroll(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  bar_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  coffee_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  wedding_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  UNIQUE(payroll_id, employee_id)
);

-- Payroll calculation results
CREATE TABLE IF NOT EXISTS payroll_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id UUID NOT NULL REFERENCES weekly_payroll(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tip_share NUMERIC(10,2) NOT NULL DEFAULT 0,
  base_wages NUMERIC(10,2) NOT NULL DEFAULT 0,
  wedding_pay NUMERIC(10,2) NOT NULL DEFAULT 0,
  coffee_pay NUMERIC(10,2) NOT NULL DEFAULT 0,
  top_up_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  gusto_tips_entry NUMERIC(10,2) NOT NULL DEFAULT 0,
  gusto_wages_entry NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_pay NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE(payroll_id, employee_id)
);

-- Seed employees
INSERT INTO employees (name, role, hourly_rate, tip_rate_multiplier, is_active, is_coffee_worker, gusto_tips_only, wedding_hourly_rate, notes) VALUES
  ('Logan', 'bartender', 15.00, 1.0, true, false, false, 30.00, 'Standard bartender'),
  ('Gabe', 'bartender', 15.00, 1.0, true, false, false, 30.00, 'Standard bartender'),
  ('Josh', 'bartender', 15.00, 0.25, true, false, false, 30.00, 'Reduced tip rate — 25% of standard'),
  ('Andrew', 'bartender', 15.00, 1.0, true, false, true, 30.00, 'Dual role: Assistant Distiller ($22/hr) + bar. Bar pay entered as Gusto Tips.'),
  ('Briana', 'barback', 15.00, 1.0, true, false, false, 30.00, 'Flat $580/wk stipend (outside app). Only in payroll when she works bar shifts.'),
  ('Indigo', 'coffee', 15.00, 1.0, true, true, false, NULL, 'Coffee bar only. $20/hr minimum guarantee.'),
  ('Katie', 'bartender', 15.00, 1.0, false, false, false, 30.00, 'Currently inactive');
