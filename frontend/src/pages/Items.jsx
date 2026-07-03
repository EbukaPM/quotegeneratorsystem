import { useEffect, useState } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { listItems, createItem, deleteItem } from '../api/items';

export default function Items() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', category: '', default_unit_cost: 0 });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    listItems()
      .then(setItems)
      .catch(() => setError('Failed to load item catalog.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createItem({ ...form, default_unit_cost: Number(form.default_unit_cost) });
      setForm({ name: '', category: '', default_unit_cost: 0 });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create item.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this catalog item?')) return;
    try {
      await deleteItem(id);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item.');
    }
  };

  const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' });

  return (
    <div>
      <h1 className="page-title">Item Catalog</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {canManage && (
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Category
            <input name="category" value={form.category} onChange={handleChange} />
          </label>
          <label>
            Default Unit Cost
            <input type="number" name="default_unit_cost" value={form.default_unit_cost} onChange={handleChange} />
          </label>
          <div>
            <button type="submit" className="btn btn-primary">
              <IconPlus size={16} /> Add Item
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="page-loading">Loading catalog...</div>
      ) : (
        <div className="panel">
          <table className="editor-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Default Unit Cost</th>
                {canDelete && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{currency.format(item.default_unit_cost)}</td>
                  {canDelete && (
                    <td>
                      <button className="icon-btn" onClick={() => handleDelete(item.id)}>
                        <IconTrash size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4}>No catalog items yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
