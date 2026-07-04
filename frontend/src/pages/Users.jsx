import { useEffect, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { register } from '../api/auth';
import { listUsers, deleteUser } from '../api/users';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = () => {
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await register(form);
      setMessage(`User ${form.name} created successfully.`);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  const handleDelete = async (targetUser) => {
    if (!window.confirm(`Remove ${targetUser.name} (${targetUser.email})?`)) return;
    setError('');
    try {
      await deleteUser(targetUser.id);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove user.');
    }
  };

  return (
    <div>
      <h1 className="page-title">Users</h1>
      <p className="page-subtitle">Create new team members and manage their access.</p>

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
        <label htmlFor="new-user-password">
          Password
          <PasswordInput
            id="new-user-password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
          />
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

      <div className="panel">
        <h2>All Users</h2>
        {loading ? (
          <div className="page-loading">Loading users...</div>
        ) : (
          <table className="editor-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role === 'admin' ? 'final' : u.role === 'manager' ? 'edit' : 'draft'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {u.id !== currentUser?.id && (
                      <button className="icon-btn" onClick={() => handleDelete(u)} title="Remove user" aria-label="Remove user">
                        <IconTrash size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
