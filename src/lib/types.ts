export interface Employee {
  id: string;
  name: string;
  role: string;
  hourly_rate: number;
  tip_rate_multiplier: number;
  is_active: boolean;
  is_coffee_worker: boolean;
  gusto_tips_only: boolean;
  wedding_hourly_rate: number | null;
  notes: string | null;
  created_at: string;
}

export interface WeeklyPayroll {
  id: string;
  week_start_date: string;
  week_end_date: string;
  toast_tips: number;
  coffee_tips: number;
  wedding_tips: number;
  total_pool: number;
  bar_tip_pool: number;
  initial_tip_rate: number;
  final_tip_rate: number;
  status: 'draft' | 'final';
  created_at: string;
  updated_at: string;
}

export interface EmployeeWeeklyHours {
  id: string;
  payroll_id: string;
  employee_id: string;
  bar_hours: number;
  coffee_hours: number;
  wedding_hours: number;
  labor_hours: number;
}

export interface PayrollResult {
  id: string;
  payroll_id: string;
  employee_id: string;
  tip_share: number;
  base_wages: number;
  wedding_pay: number;
  coffee_pay: number;
  top_up_amount: number;
  gusto_tips_entry: number;
  gusto_wages_entry: number;
  total_pay: number;
}

// For the hours entry form
export interface EmployeeHoursInput {
  employee_id: string;
  employee_name: string;
  role: string;
  bar_hours: number;
  coffee_hours: number;
  wedding_hours: number;
  labor_hours: number;
}

// Calculation output per employee
export interface EmployeePayrollCalc {
  employee_id: string;
  employee_name: string;
  role: string;
  bar_hours: number;
  coffee_hours: number;
  wedding_hours: number;
  hourly_rate: number;
  tip_rate_multiplier: number;
  is_coffee_worker: boolean;
  gusto_tips_only: boolean;
  tip_share: number;
  base_wages: number;
  wedding_pay: number;
  coffee_pay: number;
  top_up_amount: number;
  labor_hours: number;
  gusto_hours_entry: number;
  gusto_rate: number;
  gusto_tips_entry: number;
  gusto_wages_entry: number;
  total_pay: number;
}

export interface PayrollCalculation {
  toast_tips: number;
  coffee_tips: number;
  wedding_tips: number;
  total_pool: number;
  bar_tip_pool: number;
  total_bar_hours: number;
  initial_tip_rate: number;
  josh_deduction: number;
  adjusted_pool: number;
  adjusted_hours: number;
  final_tip_rate: number;
  wedding_worker_count: number;
  wedding_tip_per_worker: number;
  employees: EmployeePayrollCalc[];
}

