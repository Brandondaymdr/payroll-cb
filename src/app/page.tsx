'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WeeklyPayroll } from '@/lib/types';

export default function Dashboard() {
  const [payrolls, setPayrolls] = useState<WeeklyPayroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payroll')
      .then(res => res.json())
      .then(data => {
        setPayrolls(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Dashboard</h1>
          <p className="text-gray-500 mt-1">Weekly payroll records for Alchemy bar</p>
        </div>
        <Link href="/payroll/new" className="btn-primary">
          + New Week
        </Link>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Loading...</div>
      ) : payrolls.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No payroll records yet</p>
          <Link href="/payroll/new" className="btn-primary">
            Create Your First Payroll
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {payrolls.map(p => (
            <Link
              key={p.id}
              href={`/payroll/${p.id}`}
              className="card flex items-center justify-between hover:border-purple-300 hover:shadow-md transition-all cursor-pointer block"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                  {new Date(p.week_start_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(p.week_start_date)} — {formatDate(p.week_end_date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Toast: {formatMoney(p.toast_tips)}
                    {p.coffee_tips > 0 && <> · Coffee: {formatMoney(p.coffee_tips)}</>}
                    {p.wedding_tips > 0 && <> · Wedding: {formatMoney(p.wedding_tips)}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-900">{formatMoney(p.total_pool)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  p.status === 'final'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {p.status === 'final' ? 'Final' : 'Draft'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
