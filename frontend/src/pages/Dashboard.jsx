import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { IconBriefcase, IconFileText, IconClock, IconReceipt2 } from '@tabler/icons-react';
import { getDashboardStats } from '../api/dashboard';

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard stats.'));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <div className="page-loading">Loading dashboard...</div>;

  const cards = [
    { label: 'Total Jobs', value: stats.totalJobs, icon: IconBriefcase },
    { label: 'Total Quotes', value: stats.totalQuotes, icon: IconFileText },
    { label: 'Pending Revenue', value: currency.format(stats.pendingRevenueProjection), icon: IconClock },
    { label: 'Confirmed Income (Markup)', value: currency.format(stats.confirmedIncome), icon: IconReceipt2 },
  ];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div className="stat-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <Icon size={26} className="stat-icon" />
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Revenue by Month</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats.revenueByMonth} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)' }}
              width={72}
              tickFormatter={(value) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(value)}
            />
            <Tooltip formatter={(value) => currency.format(value)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Bar dataKey="total" fill="#7a9a1f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <h2>Recent Activity</h2>
        <ul className="activity-list">
          {stats.recentActivity.map((activity) => (
            <li key={activity.id}>
              <span className={`badge badge-${activity.change_type}`}>{activity.change_type}</span>
              <span>
                <Link to={`/jobs/${activity.job_id}`}>{activity.job_name}</Link> &ndash; Option{' '}
                {activity.option_number} by {activity.changed_by_name || 'Unknown'}
              </span>
              <span className="activity-time">{new Date(activity.created_at).toLocaleString()}</span>
            </li>
          ))}
          {stats.recentActivity.length === 0 && <li>No activity yet.</li>}
        </ul>
      </div>
    </div>
  );
}
