'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { WeeklyPayroll, PayrollResult } from '@/lib/types';

interface HoursWithEmployee {
  id: string;
  payroll_id: string;
  employee_id: string;
  bar_hours: number;
  coffee_hours: number;
  wedding_hours: number;
  labor_hours: number;
  employees: { name: string; role: string };
}

interface ResultWithEmployee extends PayrollResult {
  employees: { name: string; role: string; gusto_tips_only: boolean; is_coffee_worker: boolean; tip_rate_multiplier: number; hourly_rate: number };
}

export default function PayrollDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [payroll, setPayroll] = useState<WeeklyPayroll | null>(null);
  const [hours, setHours] = useState<HoursWithEmployee[]>([]);
  const [results, setResults] = useState<ResultWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/payroll/${id}`)
      .then(res => res.json())
      .then(data => {
        setPayroll(data.payroll);
        setHours(data.hours || []);
        setResults(data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleFinalize = async () => {
    await fetch(`/api/payroll/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'final' }),
    });
    setPayroll(prev => prev ? { ...prev, status: 'final' } : null);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this payroll record? This cannot be undone.')) return;
    await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
    router.push('/');
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) return <div className="card text-center py-12 text-gray-500">Loading...</div>;
  if (!payroll) return <div className="card text-center py-12 text-gray-500">Payroll not found</div>;

  // Helper to find hours for an employee
  const getHours = (empId: string) => hours.find(h => h.employee_id === empId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-purple-600 hover:underline mb-1 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {formatDate(payroll.week_start_date)} — {formatDate(payroll.week_end_date)}
          </h1>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
            payroll.status === 'final'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {payroll.status === 'final' ? 'Finalized' : 'Draft'}
          </span>
        </div>
        <div className="flex gap-2">
          {payroll.status === 'draft' && (
            <button onClick={handleFinalize} className="btn-success">Finalize</button>
          )}
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </div>

      {/* Tip summary */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Tip Pool Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-medium uppercase">Toast Tips</p>
            <p className="text-xl font-bold text-purple-700">{fmt(payroll.toast_tips)}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-xs text-amber-600 font-medium uppercase">Coffee Tips</p>
            <p className="text-xl font-bold text-amber-700">{fmt(payroll.coffee_tips)}</p>
          </div>
          <div className="bg-pink-50 rounded-lg p-4">
            <p className="text-xs text-pink-600 font-medium uppercase">Wedding Tips</p>
            <p className="text-xl font-bold text-pink-700">{fmt(payroll.wedding_tips)}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-xs text-emerald-600 font-medium uppercase">Bar Tip Pool</p>
            <p className="text-xl font-bold text-emerald-700">{fmt(payroll.bar_tip_pool)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium uppercase">Final Tip Rate</p>
            <p className="text-xl font-bold text-blue-700">{fmt(payroll.final_tip_rate)}/hr</p>
          </div>
        </div>
      </div>

      {/* Hours */}
      {hours.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Hours Worked</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-left">
                <th className="py-2 px-2">Employee</th>
                <th className="py-2 px-2 text-right">Bar Hours</th>
                <th className="py-2 px-2 text-right">Coffee Hours</th>
                <th className="py-2 px-2 text-right">Wedding Hours</th>
                <th className="py-2 px-2 text-right">Labor Hours</th>
              </tr>
            </thead>
            <tbody>
              {hours.map(h => (
                <tr key={h.id} className="border-b border-gray-100">
                  <td className="py-2.5 px-2 font-medium">{h.employees?.name}</td>
                  <td className="py-2.5 px-2 text-right">{h.bar_hours > 0 ? h.bar_hours : '—'}</td>
                  <td className="py-2.5 px-2 text-right">{h.coffee_hours > 0 ? h.coffee_hours : '—'}</td>
                  <td className="py-2.5 px-2 text-right">{h.wedding_hours > 0 ? h.wedding_hours : '—'}</td>
                  <td className="py-2.5 px-2 text-right">{h.labor_hours > 0 ? h.labor_hours : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Payroll Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left">
                  <th className="py-2 px-2">Employee</th>
                  <th className="py-2 px-2 text-right">Base Wages</th>
                  <th className="py-2 px-2 text-right">Tip Share</th>
                  <th className="py-2 px-2 text-right">Wedding</th>
                  <th className="py-2 px-2 text-right">Coffee</th>
                  <th className="py-2 px-2 text-right">Top-up</th>
                  <th className="py-2 px-2 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2.5 px-2 font-medium">{r.employees?.name}</td>
                    <td className="py-2.5 px-2 text-right">{r.base_wages > 0 ? fmt(r.base_wages) : '—'}</td>
                    <td className="py-2.5 px-2 text-right">{r.tip_share > 0 ? fmt(r.tip_share) : '—'}</td>
                    <td className="py-2.5 px-2 text-right">{r.wedding_pay > 0 ? fmt(r.wedding_pay) : '—'}</td>
                    <td className="py-2.5 px-2 text-right">{r.coffee_pay > 0 ? fmt(r.coffee_pay) : '—'}</td>
                    <td className="py-2.5 px-2 text-right">{r.top_up_amount > 0 ? fmt(r.top_up_amount) : '—'}</td>
                    <td className="py-2.5 px-2 text-right font-bold">{fmt(r.total_pay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gusto Entry */}
      {results.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="font-bold text-blue-900 mb-2">Gusto Entry</h2>
          <p className="text-sm text-blue-700 mb-4">Enter these in Gusto — Hours (Gusto calculates wages) and Tips (dollar amount):</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-blue-200 text-left">
                <th className="py-2 px-2 text-blue-800">Employee</th>
                <th className="py-2 px-2 text-right text-blue-800">Hours</th>
                <th className="py-2 px-2 text-right text-blue-800">Rate</th>
                <th className="py-2 px-2 text-right text-blue-800">Tips</th>
                <th className="py-2 px-2 text-right text-blue-800">Top-up</th>
                <th className="py-2 px-2 text-blue-800">Notes</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const h = getHours(r.employee_id);
                const isAndrew = r.employees?.gusto_tips_only;
                const isIndigo = r.employees?.is_coffee_worker;
                const gustoHours = isAndrew ? (h?.labor_hours || 0) : isIndigo ? (h?.coffee_hours || 0) : (h?.bar_hours || 0);
                const gustoRate = isAndrew ? 22 : (r.employees?.hourly_rate || 15);

                return (
                  <tr key={r.id} className="border-b border-blue-100">
                    <td className="py-2.5 px-2 font-medium text-blue-900">{r.employees?.name}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold">{gustoHours > 0 ? gustoHours : '—'}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-blue-600">{gustoHours > 0 ? fmt(gustoRate) + '/hr' : '—'}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold">{r.gusto_tips_entry > 0 ? fmt(r.gusto_tips_entry) : '—'}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{r.top_up_amount > 0 ? fmt(r.top_up_amount) : '—'}</td>
                    <td className="py-2.5 px-2 text-xs text-blue-600">
                      {isAndrew && `Labor ${h?.labor_hours || 0}hrs @$22 + bar/wedding comp as tips`}
                      {isIndigo && 'Coffee bar · $20/hr min'}
                      {!isAndrew && !isIndigo && (r.employees?.tip_rate_multiplier || 1) < 1 && '25% tip rate'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
