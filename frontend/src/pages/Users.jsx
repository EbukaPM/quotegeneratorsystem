import { useState } from 'react';
import { register } from '../api/auth';

export default function Users() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await register(form);
      setMessage(`User ${form.name} created successfully.`);
      setForm({ name: '', email: '', password: '', role: 'staff' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  return (
    <div>
      <h1 className="page-title">Users</h1>
      <p className="page-subtitle">Create new team members and assign their role.</p>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label>
          Full Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
        </label>
        <label>
          Role
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="staff">Staff (create only)</option>
            <option value="manager">Manager (create/edit)</option>
            <option value="admin">Admin (full access)</option>
          </select>
        </label>
        <div className="span-2">
          <button type="submit" className="btn btn-primary">
            Create User
          </button>
        </div>
      </form>
    </div>
  );
}
