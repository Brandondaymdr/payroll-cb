'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Employee, EmployeeHoursInput, PayrollCalculation } from '@/lib/types';
import { calculatePayroll } from '@/lib/payroll-calc';

type Step = 'tips' | 'hours' | 'review';

export default function NewPayrollPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('tips');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1: Week info + tips
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [toastTips, setToastTips] = useState('');
  const [coffeeTips, setCoffeeTips] = useState('');
  const [weddingTips, setWeddingTips] = useState('');

  // Step 2: Hours
  const [hours, setHours] = useState<EmployeeHoursInput[]>([]);

  // Step 3: Calculation preview
  const [calc, setCalc] = useState<PayrollCalculation | null>(null);

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then((data: Employee[]) => {
        const active = data.filter(e => e.is_active);
        setEmployees(active);
        setHours(active.map(e => ({
          employee_id: e.id,
          employee_name: e.name,
          role: e.role,
          bar_hours: 0,
          coffee_hours: 0,
          wedding_hours: 0,
        })));
        setLoading(false);
      });

    // Default week dates (Mon-Sun of current week)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setWeekStart(monday.toISOString().split('T')[0]);
    setWeekEnd(sunday.toISOString().split('T')[0]);
  }, []);

  const updateHours = (idx: number, field: keyof EmployeeHoursInput, value: number) => {
    setHours(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const runCalc = () => {
    const result = calculatePayroll(
      parseFloat(toastTips) || 0,
      parseFloat(coffeeTips) || 0,
      parseFloat(weddingTips) || 0,
      employees,
      hours
    );
    setCalc(result);
    setStep('review');
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start_date: weekStart,
          week_end_date: weekEnd,
          toast_tips: parseFloat(toastTips) || 0,
          coffee_tips: parseFloat(coffeeTips) || 0,
          wedding_tips: parseFloat(weddingTips) || 0,
          hours,
        }),
      });
      const data = await res.json();
      if (data.payroll?.id) {
        router.push(`/payroll/${data.payroll.id}`);
      }
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (loading) return <div className="card text-center py-12 text-gray-500">Loading employees...</div>;

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-8">
        {(['tips', 'hours', 'review'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === s ? 'bg-purple-600 text-white' :
              (['tips', 'hours', 'review'].indexOf(step) > i) ? 'bg-emerald-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm font-medium ${step === s ? 'text-purple-600' : 'text-gray-500'}`}>
              {s === 'tips' ? 'Week & Tips' : s === 'hours' ? 'Enter Hours' : 'Review'}
            </span>
            {i < 2 && <div className="w-12 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Tips */}
      {step === 'tips' && (
        <div className="card max-w-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Week & Tips</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">Week Start</label>
              <input type="date" className="input" value={weekStart} onChange={e => setWeekStart(e.target.value)} />
            </div>
            <div>
              <label className="label">Week End</label>
              <input type="date" className="input" value={weekEnd} onChange={e => setWeekEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Toast Tips (bar total for the week)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  className="input pl-7"
                  placeholder="0.00"
                  value={toastTips}
                  onChange={e => setToastTips(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Coffee Tips (Thu/Fri/Sat 7:30-12)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  className="input pl-7"
                  placeholder="0.00"
                  value={coffeeTips}
                  onChange={e => setCoffeeTips(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Wedding Tips (if applicable)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  className="input pl-7"
                  placeholder="0.00"
                  value={weddingTips}
                  onChange={e => setWeddingTips(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep('hours')}
              disabled={!weekStart || !weekEnd || !toastTips}
              className="btn-primary"
            >
              Next: Enter Hours
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Hours */}
      {step === 'hours' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Hours</h2>
          <p className="text-sm text-gray-500 mb-6">Enter each employee&apos;s hours for the week. Leave blank or 0 for employees who didn&apos;t work.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Employee</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Role</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Bar Hours</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Coffee Hours</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Wedding Hours</th>
                </tr>
              </thead>
              <tbody>
                {hours.map((h, idx) => {
                  const emp = employees.find(e => e.id === h.employee_id);
                  return (
                    <tr key={h.employee_id} className="border-b border-gray-100">
                      <td className="py-3 px-2 font-medium">{h.employee_name}</td>
                      <td className="py-3 px-2 text-gray-500 capitalize">{h.role}</td>
                      <td className="py-3 px-2">
                        {!emp?.is_coffee_worker ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            className="input text-center w-24 mx-auto"
                            value={h.bar_hours || ''}
                            onChange={e => updateHours(idx, 'bar_hours', parseFloat(e.target.value) || 0)}
                          />
                        ) : (
                          <span className="text-gray-300 text-center block">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {emp?.is_coffee_worker ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            className="input text-center w-24 mx-auto"
                            value={h.coffee_hours || ''}
                            onChange={e => updateHours(idx, 'coffee_hours', parseFloat(e.target.value) || 0)}
                          />
                        ) : (
                          <span className="text-gray-300 text-center block">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {!emp?.is_coffee_worker ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            className="input text-center w-24 mx-auto"
                            value={h.wedding_hours || ''}
                            onChange={e => updateHours(idx, 'wedding_hours', parseFloat(e.target.value) || 0)}
                          />
                        ) : (
                          <span className="text-gray-300 text-center block">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('tips')} className="btn-secondary">Back</button>
            <button onClick={runCalc} className="btn-primary">Review Calculations</button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && calc && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tip Pool Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-purple-600 font-medium uppercase">Toast Tips</p>
                <p className="text-xl font-bold text-purple-700">{fmt(calc.toast_tips)}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-xs text-amber-600 font-medium uppercase">Coffee Tips</p>
                <p className="text-xl font-bold text-amber-700">{fmt(calc.coffee_tips)}</p>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <p className="text-xs text-pink-600 font-medium uppercase">Wedding Tips</p>
                <p className="text-xl font-bold text-pink-700">{fmt(calc.wedding_tips)}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-xs text-emerald-600 font-medium uppercase">Total Pool</p>
                <p className="text-xl font-bold text-emerald-700">{fmt(calc.total_pool)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">Bar Tip Math</h3>
            <div className="text-sm space-y-1 text-gray-600">
              <p>Bar tip pool: {fmt(calc.bar_tip_pool)} · Total bar hours: {calc.total_bar_hours}</p>
              <p>Initial tip rate: {fmt(calc.initial_tip_rate)}/hr</p>
              {calc.josh_deduction > 0 && (
                <p className="text-amber-600">Josh deduction (25% rate): -{fmt(calc.josh_deduction)}</p>
              )}
              <p>Adjusted pool: {fmt(calc.adjusted_pool)} · Adjusted hours: {calc.adjusted_hours}</p>
              <p className="font-semibold text-gray-900">Final tip rate: {fmt(calc.final_tip_rate)}/hr</p>
              {calc.wedding_worker_count > 0 && (
                <p>Wedding: {calc.wedding_worker_count} worker(s) · {fmt(calc.wedding_tip_per_worker)} tips each</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Employee Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left">
                    <th className="py-2 px-2">Name</th>
                    <th className="py-2 px-2 text-right">Bar Hrs</th>
                    <th className="py-2 px-2 text-right">Base Wages</th>
                    <th className="py-2 px-2 text-right">Tip Share</th>
                    <th className="py-2 px-2 text-right">Wedding</th>
                    <th className="py-2 px-2 text-right">Coffee</th>
                    <th className="py-2 px-2 text-right">Top-up</th>
                    <th className="py-2 px-2 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.employees.map(e => (
                    <tr key={e.employee_id} className="border-b border-gray-100">
                      <td className="py-2.5 px-2 font-medium">{e.employee_name}</td>
                      <td className="py-2.5 px-2 text-right">{e.bar_hours || e.coffee_hours || '—'}</td>
                      <td className="py-2.5 px-2 text-right">{e.base_wages > 0 ? fmt(e.base_wages) : '—'}</td>
                      <td className="py-2.5 px-2 text-right">{e.tip_share > 0 ? fmt(e.tip_share) : '—'}</td>
                      <td className="py-2.5 px-2 text-right">{e.wedding_pay > 0 ? fmt(e.wedding_pay) : '—'}</td>
                      <td className="py-2.5 px-2 text-right">{e.coffee_pay > 0 ? fmt(e.coffee_pay) : '—'}</td>
                      <td className="py-2.5 px-2 text-right">{e.top_up_amount > 0 ? fmt(e.top_up_amount) : '—'}</td>
                      <td className="py-2.5 px-2 text-right font-bold">{fmt(e.total_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gusto Entry Summary */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-4">Gusto Entry Summary</h3>
            <p className="text-sm text-blue-700 mb-3">Enter these amounts in Gusto for each employee:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-blue-200 text-left">
                    <th className="py-2 px-2 text-blue-800">Employee</th>
                    <th className="py-2 px-2 text-right text-blue-800">Gusto Wages</th>
                    <th className="py-2 px-2 text-right text-blue-800">Gusto Tips</th>
                    <th className="py-2 px-2 text-right text-blue-800">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.employees.map(e => (
                    <tr key={e.employee_id} className="border-b border-blue-100">
                      <td className="py-2.5 px-2 font-medium text-blue-900">{e.employee_name}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmt(e.gusto_wages_entry)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmt(e.gusto_tips_entry)}</td>
                      <td className="py-2.5 px-2 text-right text-xs text-blue-600">
                        {e.gusto_tips_only && 'All as tips (dual role)'}
                        {e.is_coffee_worker && 'Coffee bar'}
                        {e.tip_rate_multiplier < 1 && '25% tip rate'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('hours')} className="btn-secondary">Back to Hours</button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-success text-lg px-8"
            >
              {saving ? 'Saving...' : 'Save Payroll'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
