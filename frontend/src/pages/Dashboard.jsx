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
import { IconBriefcase, IconFileText, IconCash, IconClock } from '@tabler/icons-react';
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
    { label: 'Confirmed Revenue', value: currency.format(stats.totalRevenueProjection), icon: IconCash },
    { label: 'Pending Revenue', value: currency.format(stats.pendingRevenueProjection), icon: IconClock },
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
          <BarChart data={stats.revenueByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => currency.format(value)} />
            <Bar dataKey="total" fill="#0b3d91" radius={[4, 4, 0, 0]} />
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
