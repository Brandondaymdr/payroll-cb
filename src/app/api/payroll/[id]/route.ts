import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET a single payroll with all related data
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const [payrollRes, hoursRes, resultsRes] = await Promise.all([
    supabase.from('weekly_payroll').select('*').eq('id', id).single(),
    supabase.from('employee_weekly_hours').select('*, employees(name, role)').eq('payroll_id', id),
    supabase.from('payroll_results').select('*, employees(name, role, gusto_tips_only, is_coffee_worker, tip_rate_multiplier, hourly_rate)').eq('payroll_id', id),
  ]);

  if (payrollRes.error) {
    return NextResponse.json({ error: payrollRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    payroll: payrollRes.data,
    hours: hoursRes.data || [],
    results: resultsRes.data || [],
  });
}

// PATCH — finalize payroll
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { data, error } = await supabase
    .from('weekly_payroll')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE a payroll (cascade deletes hours + results)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from('weekly_payroll')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
