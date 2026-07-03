import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { getJob } from '../api/jobs';
import { getQuoteDetail, createQuote, updateQuote, listQuotesForJob } from '../api/quotes';
import { listItems } from '../api/items';

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
});

function emptyLine() {
  return { item_id: '', name: '', quantity: 1, quantity_label: '', unit_cost: 0 };
}

export default function QuoteEditor() {
  const { jobId, quoteId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(quoteId);

  const [job, setJob] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [optionNumber, setOptionNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [powerDescription, setPowerDescription] = useState('');
  const [markupPercent, setMarkupPercent] = useState(0);
  const [lines, setLines] = useState([emptyLine()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [effectiveJobId, setEffectiveJobId] = useState(jobId);

  useEffect(() => {
    setLoading(true);
    listItems()
      .then(setCatalog)
      .catch(() => {});

    if (isEditing) {
      getQuoteDetail(quoteId)
        .then((quote) => {
          setEffectiveJobId(quote.job_id);
          setOptionNumber(quote.option_number);
          setTitle(quote.title || '');
          setPowerDescription(quote.power_description || '');
          setMarkupPercent(quote.markup_percent);
          setLines(
            quote.items.map((item) => ({
              item_id: item.item_id || '',
              name: item.name,
              quantity: item.quantity,
              quantity_label: item.quantity_label || '',
              unit_cost: item.unit_cost,
            }))
          );
          return getJob(quote.job_id);
        })
        .then(setJob)
        .catch(() => setError('Failed to load quotation.'))
        .finally(() => setLoading(false));
    } else {
      Promise.all([getJob(jobId), listQuotesForJob(jobId)])
        .then(([jobData, existingQuotes]) => {
          setJob(jobData);
          setOptionNumber(existingQuotes.length + 1);
          setTitle(`Option ${existingQuotes.length + 1}`);
        })
        .catch(() => setError('Failed to load job.'))
        .finally(() => setLoading(false));
    }
  }, [jobId, quoteId, isEditing]);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.quantity || 0) * Number(l.unit_cost || 0), 0),
    [lines]
  );
  const grandTotal = useMemo(
    () => subtotal + (subtotal * Number(markupPercent || 0)) / 100,
    [subtotal, markupPercent]
  );

  const updateLine = (index, patch) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const handleCatalogSelect = (index, itemId) => {
    const catalogItem = catalog.find((c) => c.id === itemId);
    updateLine(index, {
      item_id: itemId,
      name: catalogItem ? catalogItem.name : '',
      unit_cost: catalogItem ? catalogItem.default_unit_cost : 0,
    });
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      job_id: effectiveJobId,
      option_number: Number(optionNumber),
      title,
      power_description: powerDescription,
      markup_percent: Number(markupPercent),
      items: lines.map((l) => ({
        item_id: l.item_id || null,
        name: l.name,
        quantity: Number(l.quantity || 0),
        quantity_label: l.quantity_label || null,
        unit_cost: Number(l.unit_cost || 0),
      })),
    };

    try {
      if (isEditing) {
        await updateQuote(quoteId, payload);
      } else {
        await createQuote(payload);
      }
      navigate(`/jobs/${effectiveJobId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save quotation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1 className="page-title">
        {isEditing ? 'Edit Quotation' : 'New Quotation Option'} {job ? `- ${job.name}` : ''}
      </h1>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="panel form-grid">
          <label>
            Option Number
            <input type="number" min="1" value={optionNumber} onChange={(e) => setOptionNumber(e.target.value)} required />
          </label>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Solar System Set Up" />
          </label>
          <label>
            Markup (%)
            <input type="number" min="0" step="0.1" value={markupPercent} onChange={(e) => setMarkupPercent(e.target.value)} />
          </label>
          <label className="span-2">
            This option will power (one item per line)
            <textarea
              rows={4}
              value={powerDescription}
              onChange={(e) => setPowerDescription(e.target.value)}
              placeholder={'5 Industrial Fans\n4 Double-Chest Freezers\n1 Borehole'}
            />
          </label>
        </div>

        <div className="panel">
          <div className="page-header-row">
            <h2>Line Items</h2>
            <button type="button" className="btn btn-secondary" onClick={addLine}>
              <IconPlus size={16} /> Add Item
            </button>
          </div>

          <table className="editor-table">
            <thead>
              <tr>
                <th>Catalog Item</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Display Qty (e.g. "15KVA", "LOTS")</th>
                <th>Unit Cost</th>
                <th>Line Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td>
                    <select value={line.item_id} onChange={(e) => handleCatalogSelect(index, e.target.value)}>
                      <option value="">Custom</option>
                      {catalog.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input value={line.name} onChange={(e) => updateLine(index, { name: e.target.value })} required />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, { quantity: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={line.quantity_label}
                      onChange={(e) => updateLine(index, { quantity_label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={line.unit_cost}
                      onChange={(e) => updateLine(index, { unit_cost: e.target.value })}
                    />
                  </td>
                  <td>{currency.format(Number(line.quantity || 0) * Number(line.unit_cost || 0))}</td>
                  <td>
                    <button type="button" className="icon-btn" onClick={() => removeLine(index)}>
                      <IconTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals-summary">
            <div>
              Subtotal (internal cost): <strong>{currency.format(subtotal)}</strong>
            </div>
            <div>
              Markup: <strong>{markupPercent}%</strong>
            </div>
            <div className="grand-total">
              Grand Total: <strong>{currency.format(grandTotal)}</strong>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Quotation'}
        </button>
      </form>
    </div>
  );
}
