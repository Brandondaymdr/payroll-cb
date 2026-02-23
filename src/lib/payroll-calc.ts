import { Employee, EmployeeHoursInput, PayrollCalculation, EmployeePayrollCalc } from './types';

/**
 * Core payroll calculation engine for Crowded Barrel / Alchemy bar.
 *
 * Tip Pool Logic:
 * 1. Full pool = toast_tips (bar tips from Toast already include coffee+wedding implicitly,
 *    but coffee_tips and wedding_tips are entered separately)
 * 2. Bar tip pool = toast_tips (coffee and wedding tips are separate line items)
 * 3. Calculate initial tip rate = bar_tip_pool / total_bar_hours
 * 4. Calculate Josh's reduced share (25% of initial rate × his hours)
 * 5. Remove Josh's share from pool, remove his hours from denominator
 * 6. Final tip rate = adjusted_pool / adjusted_hours
 * 7. Everyone else gets final_tip_rate × their hours
 * 8. Josh gets initial_tip_rate × 0.25 × his hours
 * 9. Coffee tips → 100% to Indigo with $20/hr minimum guarantee
 * 10. Wedding tips → split equally among wedding workers + $30/hr base
 */
export function calculatePayroll(
  toastTips: number,
  coffeeTips: number,
  weddingTips: number,
  employees: Employee[],
  hours: EmployeeHoursInput[]
): PayrollCalculation {
  const fullPool = toastTips + coffeeTips + weddingTips;

  // Bar tip pool is just the toast tips (coffee and wedding are handled separately)
  const barTipPool = toastTips;

  // Build a lookup from employee_id to employee data
  const employeeMap = new Map<string, Employee>();
  employees.forEach(e => employeeMap.set(e.id, e));

  // Build hours lookup
  const hoursMap = new Map<string, EmployeeHoursInput>();
  hours.forEach(h => hoursMap.set(h.employee_id, h));

  // Determine who works at the bar this week (has bar_hours > 0 and is not coffee-only)
  const barWorkers: { employee: Employee; hours: EmployeeHoursInput }[] = [];
  let totalBarHours = 0;

  for (const h of hours) {
    const emp = employeeMap.get(h.employee_id);
    if (!emp) continue;
    if (h.bar_hours > 0 && !emp.is_coffee_worker) {
      barWorkers.push({ employee: emp, hours: h });
      totalBarHours += h.bar_hours;
    }
  }

  // Step 1: Calculate initial tip rate
  const initialTipRate = totalBarHours > 0 ? barTipPool / totalBarHours : 0;

  // Step 2: Find Josh (tip_rate_multiplier < 1) and calculate his deduction
  let joshDeduction = 0;
  let joshHours = 0;
  for (const { employee, hours: h } of barWorkers) {
    if (employee.tip_rate_multiplier < 1) {
      const joshShare = h.bar_hours * initialTipRate * employee.tip_rate_multiplier;
      joshDeduction += joshShare;
      joshHours += h.bar_hours;
    }
  }

  // Step 3: Adjusted pool and hours (remove Josh's portion)
  const adjustedPool = barTipPool - joshDeduction;
  const adjustedHours = totalBarHours - joshHours;

  // Step 4: Final tip rate for standard workers
  const finalTipRate = adjustedHours > 0 ? adjustedPool / adjustedHours : 0;

  // Wedding calculations
  const weddingWorkers = hours.filter(h => h.wedding_hours > 0);
  const weddingWorkerCount = weddingWorkers.length;
  const weddingTipPerWorker = weddingWorkerCount > 0 ? weddingTips / weddingWorkerCount : 0;

  // Calculate each employee's pay
  const results: EmployeePayrollCalc[] = [];

  for (const h of hours) {
    const emp = employeeMap.get(h.employee_id);
    if (!emp) continue;

    // Skip if employee has zero hours across all categories
    if (h.bar_hours === 0 && h.coffee_hours === 0 && h.wedding_hours === 0) continue;

    const calc: EmployeePayrollCalc = {
      employee_id: emp.id,
      employee_name: emp.name,
      role: emp.role,
      bar_hours: h.bar_hours,
      coffee_hours: h.coffee_hours,
      wedding_hours: h.wedding_hours,
      hourly_rate: emp.hourly_rate,
      tip_rate_multiplier: emp.tip_rate_multiplier,
      is_coffee_worker: emp.is_coffee_worker,
      gusto_tips_only: emp.gusto_tips_only,
      tip_share: 0,
      base_wages: 0,
      wedding_pay: 0,
      coffee_pay: 0,
      top_up_amount: 0,
      gusto_tips_entry: 0,
      gusto_wages_entry: 0,
      total_pay: 0,
    };

    // --- Bar tips ---
    if (h.bar_hours > 0 && !emp.is_coffee_worker) {
      if (emp.tip_rate_multiplier < 1) {
        // Josh: gets reduced rate based on initial tip rate
        calc.tip_share = round2(h.bar_hours * initialTipRate * emp.tip_rate_multiplier);
      } else {
        // Standard: gets final tip rate
        calc.tip_share = round2(h.bar_hours * finalTipRate);
      }
      // Base wages for bar hours
      calc.base_wages = round2(h.bar_hours * emp.hourly_rate);
    }

    // --- Wedding pay ---
    if (h.wedding_hours > 0) {
      const weddingBase = round2(h.wedding_hours * (emp.wedding_hourly_rate || 30));
      const weddingTipShare = round2(weddingTipPerWorker);
      calc.wedding_pay = round2(weddingBase + weddingTipShare);
    }

    // --- Coffee pay (Indigo) ---
    if (emp.is_coffee_worker && h.coffee_hours > 0) {
      calc.coffee_pay = round2(coffeeTips);
      // $20/hr minimum guarantee
      const effectiveRate = h.coffee_hours > 0 ? coffeeTips / h.coffee_hours : 0;
      if (effectiveRate < 20) {
        calc.top_up_amount = round2((20 - effectiveRate) * h.coffee_hours);
      }
      // Indigo's base wages for coffee hours
      calc.base_wages = round2(h.coffee_hours * emp.hourly_rate);
    }

    // --- Gusto entries ---
    if (emp.gusto_tips_only) {
      // Andrew: all bar compensation goes to Gusto Tips
      const barTotal = round2(calc.base_wages + calc.tip_share);
      const weddingTotal = calc.wedding_pay;
      calc.gusto_tips_entry = round2(barTotal + weddingTotal);
      calc.gusto_wages_entry = 0;
    } else if (emp.is_coffee_worker) {
      // Indigo: coffee pay + top-up as wages, base wages separate
      calc.gusto_wages_entry = round2(calc.base_wages + calc.top_up_amount);
      calc.gusto_tips_entry = round2(calc.coffee_pay);
    } else {
      // Standard employees
      calc.gusto_wages_entry = round2(calc.base_wages);
      calc.gusto_tips_entry = round2(calc.tip_share + calc.wedding_pay);
    }

    calc.total_pay = round2(
      calc.base_wages + calc.tip_share + calc.wedding_pay + calc.coffee_pay + calc.top_up_amount
    );

    // For Andrew, avoid double-counting base_wages in total since it's folded into gusto_tips
    if (emp.gusto_tips_only) {
      calc.total_pay = round2(calc.gusto_tips_entry);
    }

    results.push(calc);
  }

  return {
    toast_tips: toastTips,
    coffee_tips: coffeeTips,
    wedding_tips: weddingTips,
    total_pool: fullPool,
    bar_tip_pool: barTipPool,
    total_bar_hours: totalBarHours,
    initial_tip_rate: round4(initialTipRate),
    josh_deduction: round2(joshDeduction),
    adjusted_pool: round2(adjustedPool),
    adjusted_hours: round2(adjustedHours),
    final_tip_rate: round4(finalTipRate),
    wedding_worker_count: weddingWorkerCount,
    wedding_tip_per_worker: round2(weddingTipPerWorker),
    employees: results,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
