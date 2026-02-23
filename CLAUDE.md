# Crowded Barrel Payroll App — Claude Context

## Project Overview
This is a weekly payroll calculation app for **Alchemy**, the bar at Crowded Barrel (a distillery). It replaces a manual Excel workflow. Tips come from Toast (the bar's POS system) and are distributed to employees based on a set of rules.

## Tech Stack
- **Frontend**: Next.js (App Router)
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Auth**: Supabase Auth (single user — the owner/manager)

---

## Core Payroll Logic

### Weekly Inputs (entered manually each week)
- Toast total tips (one number for the whole week)
- Each employee's hours worked at the bar
- Coffee tips total (pulled manually from Toast by shift — Thu/Fri/Sat 7:30–12)
- Wedding hours and wedding tips (if applicable)
- Indigo's coffee hours (tracked separately)

### Tip Pool Calculation — Step by Step

1. **Start with**: Toast tips + coffee tips + wedding tips = Full tip pool
2. **Remove coffee tips**: Pulled out entirely for Indigo (see Indigo rules below)
3. **Remove wedding tips**: Pulled out entirely for wedding workers (see Wedding rules)
4. **Remaining pool** is used for bar tip distribution
5. **Calculate initial tip rate**: Remaining tips ÷ total bar hours (excluding wedding-only hours)
6. **Remove Josh's share**: Josh gets 25% of the standard tip rate. Calculate (Josh hours × standard rate × 0.25), subtract that dollar amount from the pool, subtract Josh's hours from the tip-hour denominator
7. **Recalculate final tip rate**: Adjusted pool ÷ adjusted hours
8. **Distribute**: Each eligible employee gets (their hours × final tip rate), except Josh who gets (his hours × standard rate × 0.25)

---

## Employees & Rules

### Logan
- Standard bartender
- Hourly base rate + standard tip share
- Hours and tips distributed normally

### Gabe
- Standard bartender
- Same rules as Logan

### Josh
- Bartender with **reduced tip rate**
- Gets **25% of the standard per-hour tip rate** (not the full rate)
- His tip total is removed from the pool and his hours removed from the denominator before others are calculated
- Still gets his full hourly base wage

### Andrew
- **Dual role**: Primary job is Assistant Distiller at Crowded Barrel ($22/hr)
- **Bar shifts (Tuesdays)**: Works as a normal bartender. Gets $15/hr + same tip rate as other bartenders. However, his entire bar compensation ($15 × hours + his tip share) is recorded in Gusto as **Tips** (not wages), because his wages come from his distillery role
- **Wedding shifts**: Gets $30/hr + share of wedding tips (see Wedding rules)
- His hours count normally toward the bar tip pool

### Briana
- **Barback** at Crowded Barrel (company-wide role, not bar-specific)
- Receives a **flat $580/week** from the company regardless of bar work — this is handled outside this app
- Occasionally fills in at the bar — when she does, she gets hours + standard tip share like a regular bartender
- Only appears in weekly payroll when she actually works a bar shift

### Indigo
- **Coffee bar only** — works Thu/Fri/Sat, 7:30 AM – 12:00 PM
- Gets **100% of coffee tips** from her shifts
- Has a **$20/hr minimum**: if (coffee tips ÷ coffee hours) < $20, she receives a top-up to reach $20/hr
- Indigo's hours and tips are **completely separate** from the bar tip pool
- Base hourly rate: $15/hr (the top-up bridges the gap to $20/hr minimum)

### Katie
- Currently inactive — do not include in payroll calculations

---

## Wedding Shifts

- Any bartender can work a wedding (Andrew is most common)
- Wedding workers receive: **$30/hr + their share of wedding tips**
- If multiple people work the wedding, wedding tips are split equally between them
- Wedding hours and tips are fully removed from the bar tip pool before bar distribution

---

## Andrew's Gusto Payroll Entry
Andrew's bar and wedding earnings are entered into Gusto as **Tips**, not wages:
- Bar: ($15 × bar hours) + (bar hours × tip rate) = total entered as tips
- Wedding: ($30 × wedding hours) + (his share of wedding tips) = total entered as tips

---

## Database Schema (Supabase)

### `employees`
- id, name, role, hourly_rate, tip_rate_multiplier (1.0 for standard, 0.25 for Josh), is_active, notes
- Special flags: is_coffee_worker (Indigo), gusto_tips_only (Andrew), flat_weekly_stipend (Briana, stored separately)

### `weekly_payroll`
- id, week_start_date, week_end_date, toast_tips, coffee_tips, wedding_tips, total_pool, status (draft/final)

### `employee_weekly_hours`
- id, payroll_id, employee_id, bar_hours, coffee_hours, wedding_hours, fang_hours (Andrew's distillery hours if applicable)

### `payroll_results`
- id, payroll_id, employee_id, tip_share, base_wages, wedding_pay, coffee_pay, top_up_amount, gusto_tips_entry, gusto_wages_entry

---

## UI Flow
1. **Dashboard**: List of weekly payroll records with status
2. **New Week**: Enter week dates, Toast tips, coffee tips (if any), wedding info (if any)
3. **Enter Hours**: Grid of employees × hour types
4. **Review Calculations**: Shows full breakdown — tip pool math, each person's share
5. **Final Summary**: Shows what to enter in Gusto for each person (wages vs. tips columns)
6. **Employee Management**: Edit hourly rates, add/remove employees

---

## Key Business Rules to Never Break
- Coffee tips never enter the bar pool
- Wedding tips never enter the bar pool  
- Josh's reduced rate must be calculated BEFORE the final rate for others
- Andrew's bar compensation is always Gusto tips, never Gusto wages
- Indigo always gets her $20/hr floor, even if coffee tips are zero
- Briana's $580 is a company stipend — not calculated here
