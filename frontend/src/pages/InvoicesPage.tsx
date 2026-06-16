import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText, HiOutlineTrash } from 'react-icons/hi2';
import './Invoices.css';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  client?: { name: string };
  dueDate: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams({ limit: '50', sort: '-createdAt' });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/invoices?${params}`);
      setInvoices(Array.isArray(data.data) ? data.data : data.data.invoices || []);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [statusFilter]);

  const handleDelete = async (id: string, num: string) => {
    if (!confirm(`Delete invoice ${num}?`)) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      setInvoices((prev) => prev.filter((i) => i._id !== id));
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /> Loading invoices...</div>;
  }

  return (
    <div className="invoices-page animate-in">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>Create and manage your invoices</p>
        </div>
        <div className="header-actions">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Link to="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="glass-card empty-state">
          <HiOutlineDocumentText />
          <h3>No invoices found</h3>
          <p>{statusFilter ? `No ${statusFilter} invoices` : 'Create your first invoice to get started'}</p>
          <Link to="/invoices/new" className="btn btn-primary">Create Invoice</Link>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>
                    <Link to={`/invoices/${inv._id}`} style={{ color: 'var(--accent-primary-hover)', fontWeight: 600 }}>
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td>{inv.client?.name || '—'}</td>
                  <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{inv.total?.toLocaleString()}</td>
                  <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link to={`/invoices/${inv._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inv._id, inv.invoiceNumber)}>
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
