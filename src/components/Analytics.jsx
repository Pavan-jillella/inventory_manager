import { useEffect, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './Analytics.css';

export function DateFilters({ preset, setPreset, start, setStart, end, setEnd, today }) {
  return <form className="analytics-filters" aria-label="Reporting period" onSubmit={event => { event.preventDefault(); const values = new FormData(event.currentTarget); setStart(String(values.get('start'))); setEnd(String(values.get('end'))); }}><label>Period<select aria-label="Period" value={preset} onChange={e => setPreset(e.target.value)}><option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="custom">Custom dates</option></select></label>{preset === 'custom' && <><label>From<input name="start" type="date" required defaultValue={start} max={today} /></label><label>To<input name="end" type="date" required defaultValue={end} max={today} /></label><button type="submit" className="btn btn-outline">Apply dates</button></>}</form>;
}
export function TrendChart({ title, data, series, label = 'date', bars = false, area = false, note }) {
  const Chart = bars ? BarChart : area ? AreaChart : LineChart;
  const colors = ['#658cb1', '#76a88b', '#ce9971', '#a38bbb'];
  return <section className="analytics-panel"><h2>{title}</h2>{note && <p className="analytics-note">{note}</p>}{data.length ? <><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><Chart data={data} accessibilityLayer><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e7e2" /><XAxis dataKey={label} tick={{ fontSize: 11 }} minTickGap={20} /><YAxis tick={{ fontSize: 11 }} width={55} /><Tooltip /><Legend />{series.map((s, index) => bars ? <Bar key={s.key} dataKey={s.key} name={s.name} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} /> : area ? <Area key={s.key} type="linear" dataKey={s.key} name={s.name} fill={colors[index % colors.length]} fillOpacity={0.18} stroke={colors[index % colors.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} /> : <Line key={s.key} dataKey={s.key} name={s.name} stroke={colors[index % colors.length]} strokeWidth={2} dot={data.length < 15} connectNulls={false} />)}</Chart></ResponsiveContainer></div><details><summary>View chart data</summary><div className="analytics-table"><table><thead><tr><th>{label}</th>{series.map(s => <th key={s.key}>{s.name}</th>)}</tr></thead><tbody>{data.map((row, index) => <tr key={index}><td>{row[label]}</td>{series.map(s => <td key={s.key}>{row[s.key] == null ? 'Not recorded' : Number(row[s.key]).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>)}</tr>)}</tbody></table></div></details></> : <p>No records for this period.</p>}</section>;
}
export function DetailDialog({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="analytics-dialog" aria-label={title} onClose={onClose}><header><h2>{title}</h2><button className="btn btn-outline" onClick={() => ref.current.close()}>Close</button></header>{children}</dialog>;
}
