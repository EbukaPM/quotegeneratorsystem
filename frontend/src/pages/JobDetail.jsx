import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { IconPlus, IconDownload, IconHistory, IconFilePlus } from '@tabler/icons-react';
import { getJob, downloadProposalPdf } from '../api/jobs';
import { listQuotesForJob, downloadQuotePdf } from '../api/quotes';

export default function JobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currency = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  });

  const load = () => {
    setLoading(true);
    Promise.all([getJob(jobId), listQuotesForJob(jobId)])
      .then(([jobData, quotesData]) => {
        setJob(jobData);
        setQuotes(quotesData);
      })
      .catch(() => setError('Failed to load job details.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [jobId]);

  if (loading) return <div className="page-loading">Loading job...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!job) return null;

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{job.name}</h1>
          <p className="page-subtitle">{job.client_name}</p>
        </div>
        <div className="btn-group">
          {quotes.length > 0 && (
            <button className="btn btn-secondary" onClick={() => downloadProposalPdf(job.id)}>
              <IconDownload size={18} /> Full Proposal PDF
            </button>
          )}
          <Link className="btn btn-primary" to={`/jobs/${job.id}/quotes/new`}>
            <IconPlus size={18} /> New Option
          </Link>
        </div>
      </div>

      <div className="panel">
        <h2>Client Details</h2>
        <dl className="detail-list">
          <dt>Client</dt>
          <dd>{job.client_name || '-'}</dd>
          <dt>Address</dt>
          <dd>{job.client_address || '-'}</dd>
          <dt>Contact</dt>
          <dd>{job.client_contact || '-'}</dd>
          <dt>Description</dt>
          <dd>{job.description || '-'}</dd>
        </dl>
      </div>

      <div className="panel">
        <h2>Quotation Options</h2>
        <div className="quote-option-grid">
          {quotes.map((q) => (
            <div className="quote-option-card" key={q.id}>
              <div className="quote-option-header">
                <span className="option-badge">OPTION {q.option_number}</span>
                <span className={`badge badge-${q.status}`}>{q.status}</span>
              </div>
              <h3>{q.title}</h3>
              <p className="quote-total">{currency.format(q.grand_total)}</p>
              <p className="quote-markup">Markup: {q.markup_percent}%</p>
              <div className="quote-option-actions">
                <Link to={`/quotes/${q.id}/edit`}>Edit</Link>
                <Link to={`/quotes/${q.id}/history`}>
                  <IconHistory size={16} /> History
                </Link>
                <button onClick={() => downloadQuotePdf(q.id)}>
                  <IconDownload size={16} /> PDF
                </button>
              </div>
            </div>
          ))}
          {quotes.length === 0 && (
            <div className="empty-state">
              <IconFilePlus size={32} />
              <p>No quotation options yet. Create the first variation for this job.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
