import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculatePayroll } from '@/lib/payroll-calc';
import { Employee, EmployeeHoursInput } from '@/lib/types';

// GET all payrolls (for dashboard)
export async function GET() {
  const { data, error } = await supabase
    .from('weekly_payroll')
    .select('*')
    .order('week_start_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create new payroll week + calculate
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    week_start_date,
    week_end_date,
    toast_tips,
    coffee_tips,
    wedding_tips,
    hours, // EmployeeHoursInput[]
  } = body;

  // 1. Fetch active employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true);

  if (empError || !employees) {
    return NextResponse.json({ error: empError?.message || 'No employees' }, { status: 500 });
  }

  // 2. Run calculations
  const calc = calculatePayroll(
    Number(toast_tips),
    Number(coffee_tips),
    Number(wedding_tips),
    employees as Employee[],
    hours as EmployeeHoursInput[]
  );

  // 3. Insert weekly_payroll record
  const { data: payroll, error: payrollError } = await supabase
    .from('weekly_payroll')
    .insert({
      week_start_date,
      week_end_date,
      toast_tips: Number(toast_tips),
      coffee_tips: Number(coffee_tips),
      wedding_tips: Number(wedding_tips),
      bar_tip_pool: calc.bar_tip_pool,
      initial_tip_rate: calc.initial_tip_rate,
      final_tip_rate: calc.final_tip_rate,
      status: 'draft',
    })
    .select()
    .single();

  if (payrollError || !payroll) {
    return NextResponse.json({ error: payrollError?.message || 'Failed to create payroll' }, { status: 500 });
  }

  // 4. Insert employee hours
  const hoursInserts = (hours as EmployeeHoursInput[])
    .filter(h => h.bar_hours > 0 || h.coffee_hours > 0 || h.wedding_hours > 0)
    .map(h => ({
      payroll_id: payroll.id,
      employee_id: h.employee_id,
      bar_hours: h.bar_hours,
      coffee_hours: h.coffee_hours,
      wedding_hours: h.wedding_hours,
      labor_hours: h.labor_hours || 0,
    }));

  if (hoursInserts.length > 0) {
    const { error: hoursError } = await supabase
      .from('employee_weekly_hours')
      .insert(hoursInserts);

    if (hoursError) {
      // Clean up the payroll record
      await supabase.from('weekly_payroll').delete().eq('id', payroll.id);
      return NextResponse.json({ error: hoursError.message }, { status: 500 });
    }
  }

  // 5. Insert payroll results
  const resultInserts = calc.employees.map(e => ({
    payroll_id: payroll.id,
    employee_id: e.employee_id,
    tip_share: e.tip_share,
    base_wages: e.base_wages,
    wedding_pay: e.wedding_pay,
    coffee_pay: e.coffee_pay,
    top_up_amount: e.top_up_amount,
    gusto_tips_entry: e.gusto_tips_entry,
    gusto_wages_entry: e.gusto_wages_entry,
    total_pay: e.total_pay,
  }));

  if (resultInserts.length > 0) {
    const { error: resultError } = await supabase
      .from('payroll_results')
      .insert(resultInserts);

    if (resultError) {
      return NextResponse.json({ error: resultError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ payroll, calculation: calc });
}
