import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import { listJobs, createJob } from '../api/jobs';

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', client_name: '', client_address: '', client_contact: '', description: '' });
  const [error, setError] = useState('');

  const loadJobs = () => {
    setLoading(true);
    listJobs()
      .then(setJobs)
      .catch(() => setError('Failed to load jobs.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadJobs, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const job = await createJob(form);
      setShowForm(false);
      setForm({ name: '', client_name: '', client_address: '', client_contact: '', description: '' });
      navigate(`/jobs/${job.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job.');
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <h1 className="page-title">Jobs</h1>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          <IconPlus size={18} /> New Job
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <label>
            Job Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Client Name
            <input name="client_name" value={form.client_name} onChange={handleChange} />
          </label>
          <label>
            Client Address
            <input name="client_address" value={form.client_address} onChange={handleChange} />
          </label>
          <label>
            Client Contact
            <input name="client_contact" value={form.client_contact} onChange={handleChange} />
          </label>
          <label className="span-2">
            Description
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
          </label>
          <div className="span-2">
            <button type="submit" className="btn btn-primary">
              Create Job
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="page-loading">Loading jobs...</div>
      ) : (
        <div className="card-grid">
          {jobs.map((job) => (
            <Link to={`/jobs/${job.id}`} className="job-card" key={job.id}>
              <h3>{job.name}</h3>
              <p>{job.client_name || 'No client assigned'}</p>
              <div className="job-card-footer">
                <span>{job.quotation_count} quote option(s)</span>
                <span>{new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
          {jobs.length === 0 && <p>No jobs yet. Create one to get started.</p>}
        </div>
      )}
    </div>
  );
}
