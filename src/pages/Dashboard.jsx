import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DonutChart } from '../components/VisualCharts';
import { DateFilters, TrendChart } from '../components/Analytics';
import { comparison, dateKey, dateRange, inRange, shiftDate, sumMoney } from '../lib/analytics';
import { SHIFTS } from '../data/mockData';

export const Dashboard = () => {
  const { items, logs } = useAppContext();
  const today = dateKey(new Date());
  const [preset, setPreset] = useState('7');
  const [start, setStart] = useState(shiftDate(today, -6));
  const [end, setEnd] = useState(today);
  const range = dateRange(preset, start, end, today);
  const selected = range ? logs.filter(log => inRange(dateKey(log.timestamp), range.from, range.to)) : [];
  const previous = range ? logs.filter(log => inRange(dateKey(log.timestamp), range.previousFrom, range.previousTo)) : [];
  const revenue = sumMoney(selected, 'totalAmount');
  const previousRevenue = sumMoney(previous, 'totalAmount');
  const units = selected.reduce((sum, row) => sum + row.quantity, 0);
  const previousUnits = previous.reduce((sum, row) => sum + row.quantity, 0);
  const daily = range ? Array.from({ length: range.days }, (_, index) => {
    const date = shiftDate(range.from, index);
    const previousDate = shiftDate(range.previousFrom, index);
    return { date, sales: sumMoney(selected.filter(log => dateKey(log.timestamp) === date), 'totalAmount'), previous: sumMoney(previous.filter(log => dateKey(log.timestamp) === previousDate), 'totalAmount') };
  }) : [];
  const categories = [...new Set(items.map(item => item.category))].map(category => ({ category, units: items.filter(item => item.category === category).reduce((sum, item) => sum + item.stock, 0) }));
  const costsToReview = items.filter(item => !Number(item.purchaseRate)).length;
  return <div className="suite-page dashboard-page">
    <div className="app-header"><div><h1>Control Center</h1><p className="text-secondary">Inventory health and shift performance, with a shared reporting period.</p></div></div>
    <DateFilters {...{ preset, setPreset, start, setStart, end, setEnd, today }} />
    {!range ? <p role="alert" className="analytics-warning">Choose valid dates ending today or earlier, up to 366 days.</p> : <>
      <p className="analytics-note">{range.from} – {range.to} · Compared with {range.previousFrom} – {range.previousTo}. Dates follow this browser’s local time. Today may be a partial day.</p>
      <div className="analytics-metrics">
        <article><span>Sales · selected period</span><strong>${revenue.toFixed(2)}</strong><small>{comparison(revenue, previousRevenue)}</small></article>
        <article><span>Units issued · selected period</span><strong>{units}</strong><small>{comparison(units, previousUnits)}</small></article>
        <article><span>Issue entries · selected period</span><strong>{selected.length}</strong><small>{comparison(selected.length, previous.length)}</small></article>
        <article><span>Units in stock · now</span><strong>{items.reduce((sum, item) => sum + item.stock, 0)}</strong><small>{items.filter(item => item.stock <= item.minStock).length} products need restocking</small></article>
      </div>
      {costsToReview > 0 && <p className="analytics-warning">{costsToReview} products have zero or missing purchase costs. Review these costs before relying on inventory valuation or profit reports.</p>}
      <TrendChart title="Sales compared with previous period" data={daily} series={[{ key: 'sales', name: 'Selected period ($)' }, { key: 'previous', name: 'Previous period ($)' }]} note="Previous-period dates are aligned by position for comparison. No recorded activity appears as zero." />
      <div className="analytics-grid"><TrendChart title="Shift performance · selected period" bars data={SHIFTS.map(shift => ({ shift: shift.label, sales: sumMoney(selected.filter(log => log.shift === shift.id), 'totalAmount') }))} label="shift" series={[{ key: 'sales', name: 'Sales ($)' }]} /><DonutChart title="Stock by category · now" data={categories} label="category" value="units" unit="Units on hand" note="Current stock is a live snapshot and does not change with the reporting dates." /></div>
    </>}
  </div>;
};
