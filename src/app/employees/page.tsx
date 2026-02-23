'use client';

import { useEffect, useState } from 'react';
import { Employee } from '@/lib/types';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newEmp, setNewEmp] = useState({
    name: '',
    role: 'bartender',
    hourly_rate: 15,
    tip_rate_multiplier: 1.0,
    is_coffee_worker: false,
    gusto_tips_only: false,
    wedding_hourly_rate: 30,
    notes: '',
  });

  const fetchEmployees = () => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        setEmployees(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleSave = async (id: string) => {
    await fetch('/api/employees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    });
    setEditingId(null);
    fetchEmployees();
  };

  const handleAdd = async () => {
    await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newEmp, is_active: true }),
    });
    setShowAdd(false);
    setNewEmp({ name: '', role: 'bartender', hourly_rate: 15, tip_rate_multiplier: 1.0, is_coffee_worker: false, gusto_tips_only: false, wedding_hourly_rate: 30, notes: '' });
    fetchEmployees();
  };

  const toggleActive = async (emp: Employee) => {
    await fetch('/api/employees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: emp.id, is_active: !emp.is_active }),
    });
    fetchEmployees();
  };

  if (loading) return <div className="card text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage staff, rates, and special rules</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          {showAdd ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showAdd && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Employee</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={newEmp.role} onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}>
                <option value="bartender">Bartender</option>
                <option value="barback">Barback</option>
                <option value="coffee">Coffee</option>
              </select>
            </div>
            <div>
              <label className="label">Hourly Rate</label>
              <input className="input" type="number" step="0.50" value={newEmp.hourly_rate} onChange={e => setNewEmp({ ...newEmp, hourly_rate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="label">Tip Multiplier</label>
              <input className="input" type="number" step="0.05" value={newEmp.tip_rate_multiplier} onChange={e => setNewEmp({ ...newEmp, tip_rate_multiplier: parseFloat(e.target.value) || 1 })} />
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newEmp.is_coffee_worker} onChange={e => setNewEmp({ ...newEmp, is_coffee_worker: e.target.checked })} />
              Coffee worker
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newEmp.gusto_tips_only} onChange={e => setNewEmp({ ...newEmp, gusto_tips_only: e.target.checked })} />
              Gusto tips only
            </label>
          </div>
          <div className="mt-4">
            <label className="label">Notes</label>
            <input className="input" value={newEmp.notes} onChange={e => setNewEmp({ ...newEmp, notes: e.target.value })} />
          </div>
          <button onClick={handleAdd} disabled={!newEmp.name} className="btn-success mt-4">
            Save Employee
          </button>
        </div>
      )}

      <div className="space-y-3">
        {employees.map(emp => (
          <div key={emp.id} className={`card ${!emp.is_active ? 'opacity-50' : ''}`}>
            {editingId === emp.id ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="label">Name</label>
                    <input className="input" value={editForm.name ?? emp.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Hourly Rate</label>
                    <input className="input" type="number" step="0.50" value={editForm.hourly_rate ?? emp.hourly_rate} onChange={e => setEditForm({ ...editForm, hourly_rate: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label">Tip Multiplier</label>
                    <input className="input" type="number" step="0.05" value={editForm.tip_rate_multiplier ?? emp.tip_rate_multiplier} onChange={e => setEditForm({ ...editForm, tip_rate_multiplier: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <input className="input" value={editForm.notes ?? emp.notes ?? ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleSave(emp.id)} className="btn-success text-sm">Save</button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    emp.is_coffee_worker ? 'bg-amber-100 text-amber-700' :
                    emp.gusto_tips_only ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{emp.name}</p>
                    <p className="text-sm text-gray-500">
                      {emp.role} · ${emp.hourly_rate}/hr
                      {emp.tip_rate_multiplier !== 1 && ` · ${emp.tip_rate_multiplier * 100}% tips`}
                      {emp.is_coffee_worker && ' · Coffee bar'}
                      {emp.gusto_tips_only && ' · Gusto tips only'}
                    </p>
                    {emp.notes && <p className="text-xs text-gray-400 mt-0.5">{emp.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingId(emp.id); setEditForm({}); }}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(emp)}
                    className={`text-sm py-1.5 px-3 rounded-lg font-medium ${
                      emp.is_active ? 'btn-danger' : 'btn-success'
                    }`}
                  >
                    {emp.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
