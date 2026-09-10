import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import './Analytics.css';

const COLORS = ['#658cb1', '#76a88b', '#ce9971', '#a38bbb', '#cc8293', '#79a9ab'];
const number = value => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
const format = (value, currency) => currency ? Number(value).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : number(value);

export function DonutChart({ title, data, label = 'label', value = 'amount', unit = 'units', currency = false, note }) {
  const rows = data.filter(row => Number.isFinite(Number(row[value])) && Number(row[value]) > 0).map(row => ({ name: String(row[label]), value: Number(row[value]) }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return <section className="analytics-panel"><h2>{title}</h2>{note && <p className="analytics-note">{note}</p>}{total > 0 ? <>
    <div className="donut-frame"><div className="donut-center" aria-hidden="true"><strong>{format(total, currency)}</strong><span>{currency ? 'total spend' : unit}</span></div><ResponsiveContainer width="100%" height="100%"><PieChart accessibilityLayer><Pie data={rows} dataKey="value" nameKey="name" innerRadius="67%" outerRadius="89%" paddingAngle={rows.length > 1 ? 3 : 0} stroke="none" isAnimationActive={false}>{rows.map((row, index) => <Cell key={row.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(amount, name) => [format(amount, currency), name]} /></PieChart></ResponsiveContainer></div>
    <ul className="donut-legend">{rows.map((row, index) => <li key={row.name}><span className="donut-dot" style={{ background: COLORS[index % COLORS.length] }} /><span>{row.name}</span><strong>{format(row.value, currency)}</strong><small>{(row.value / total * 100).toFixed(1)}%</small></li>)}</ul>
    <details><summary>View chart data</summary><div className="analytics-table"><table><thead><tr><th>Category</th><th>{currency ? 'Spend ($)' : unit}</th><th>Share</th></tr></thead><tbody>{rows.map(row => <tr key={row.name}><td>{row.name}</td><td>{format(row.value, currency)}</td><td>{(row.value / total * 100).toFixed(1)}%</td></tr>)}</tbody></table></div></details>
  </> : <div className="visual-empty"><div className="empty-donut" aria-hidden="true" /><p>No recorded {currency ? 'spending' : unit.toLowerCase()} for this view.</p></div>}</section>;
}

export function BudgetGauge({ spent, budget }) {
  const known = budget !== null && Number.isFinite(budget) && budget >= 0;
  const percent = known && budget > 0 ? spent / budget * 100 : null;
  const over = known && spent > budget;
  const fill = percent === null ? (over ? 100 : 0) : Math.min(100, Math.max(0, percent));
  const label = !known ? 'Not set' : percent === null ? 'Zero budget' : `${number(percent)}%`;
  return <div className="budget-visual"><div className="budget-ring"><svg viewBox="0 0 120 120" role="img" aria-label={`Monthly budget: ${label}${over ? ', over budget' : ''}`}><circle cx="60" cy="60" r="50" fill="none" stroke="#eaf0ed" strokeWidth="9" /><circle cx="60" cy="60" r="50" fill="none" stroke={over ? '#c77b76' : '#76a88b'} strokeWidth="9" strokeOpacity={fill > 0 ? 1 : 0} strokeLinecap="round" pathLength="100" strokeDasharray={`${fill} 100`} transform="rotate(-90 60 60)" /></svg><div aria-hidden="true"><strong>{label}</strong><span>{over ? 'over limit' : 'budget used'}</span></div></div><div><p className="budget-caption">{!known ? 'Set a monthly limit to track your spending.' : over ? `${format(spent - budget, true)} above your monthly limit` : `${format(budget - spent, true)} available this month`}</p><p className="analytics-note">{format(spent, true)} spent{known ? ` of ${format(budget, true)} budgeted` : ''}. The ring stops at 100%; the label shows the full percentage when over budget.</p><details><summary>View budget data</summary><div className="analytics-table"><table><tbody><tr><th>Spent</th><td>{format(spent, true)}</td></tr><tr><th>Budget</th><td>{known ? format(budget, true) : 'Not set'}</td></tr><tr><th>Budget used</th><td>{label}</td></tr></tbody></table></div></details></div></div>;
}

export function UsageHeatmap({ title, data }) {
  const [selected, setSelected] = useState(null);
  const active = data.find(row => row.date === selected) || data.at(-1);
  const peak = Math.max(0, ...data.map(row => row.used));
  const max = Math.max(1, peak);
  const padding = data.length ? (new Date(`${data[0].date}T12:00:00Z`).getUTCDay() + 6) % 7 : 0;
  const colors = ['#f1f4f2', '#dbece2', '#b1d5c0', '#7aac92', '#4e8066'];
  return <section className="analytics-panel"><h2>{title}</h2><p className="analytics-note">Each square is one day. Select a date to see its recorded usage; darker squares mean more units issued.</p>{data.length ? <>
    <div className="usage-calendar"><div className="usage-weekdays" aria-hidden="true">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}</div><div className="usage-squares">{Array.from({ length: padding }, (_, index) => <span key={`blank-${index}`} />)}{data.map(row => { const level = row.used > 0 ? Math.max(1, Math.ceil(row.used / max * 4)) : 0; return <button key={row.date} aria-label={`${row.date}: ${number(row.used)} units issued`} aria-pressed={row.date === active?.date} title={`${row.date}: ${number(row.used)} units issued`} onClick={() => setSelected(row.date)} style={{ background: colors[level], color: level >= 3 ? '#fff' : '#42624e' }}>{Number(row.date.slice(-2))}</button>; })}</div></div>
    <div className="heatmap-key"><span>0 recorded</span>{colors.map(color => <i key={color} style={{ background: color }} aria-hidden="true" />)}<span>{peak ? `${number(peak)} units` : 'No usage recorded'}</span></div>
    <p className="heatmap-selection" aria-live="polite"><strong>{active.date}</strong><span>{number(active.used)} units issued</span></p><p className="analytics-note">{data[0].date} – {data.at(-1).date}. A zero square means no usage was recorded, rather than proof of no consumption.</p>
    <details><summary>View chart data</summary><div className="analytics-table"><table><thead><tr><th>Date</th><th>Units issued</th></tr></thead><tbody>{data.map(row => <tr key={row.date}><td>{row.date}</td><td>{number(row.used)}</td></tr>)}</tbody></table></div></details>
  </> : <p>No usage history available.</p>}</section>;
}
