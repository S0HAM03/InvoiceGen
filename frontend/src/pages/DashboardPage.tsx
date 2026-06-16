import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { HiOutlineUsers, HiOutlineDocumentText, HiOutlineCurrencyRupee, HiOutlineClock } from 'react-icons/hi2';
import './Dashboard.css';

interface Stats {
  totalClients: number;
  totalInvoices: number;
  draftInvoices: number;
  sentInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
}

interface RecentInvoice {
  _id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  client?: { name: string };
  dueDate: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0, totalInvoices: 0, draftInvoices: 0,
    sentInvoices: 0, paidInvoices: 0, overdueInvoices: 0, totalRevenue: 0,
  });
  const [recent, setRecent] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, invoicesRes] = await Promise.all([
          api.get('/clients?limit=1'),
          api.get('/invoices?limit=5&sort=-createdAt'),
        ]);

        const totalClients = clientsRes.data.data.pagination?.total || clientsRes.data.data.clients?.length || 0;
        const invoices = invoicesRes.data.data.invoices || [];
        const allInvoicesTotal = invoicesRes.data.data.pagination?.total || invoices.length;

        // Calculate stats from the returned invoices
        let draftCount = 0, sentCount = 0, paidCount = 0, overdueCount = 0, revenue = 0;
        invoices.forEach((inv: any) => {
          if (inv.status === 'draft') draftCount++;
          if (inv.status === 'sent') sentCount++;
          if (inv.status === 'paid') { paidCount++; revenue += inv.total || 0; }
          if (inv.status === 'overdue') overdueCount++;
        });

        setStats({
          totalClients,
          totalInvoices: allInvoicesTotal,
          draftInvoices: draftCount,
          sentInvoices: sentCount,
          paidInvoices: paidCount,
          overdueInvoices: overdueCount,
          totalRevenue: revenue,
        });
        setRecent(invoices);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /> Loading dashboard...</div>;
  }

  return (
    <div className="dashboard animate-in">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
          <p>Here's an overview of your invoicing activity</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">
          + New Invoice
        </Link>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-purple"><HiOutlineUsers /></div>
          <span className="stat-label">Total Clients</span>
          <span className="stat-value">{stats.totalClients}</span>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-blue"><HiOutlineDocumentText /></div>
          <span className="stat-label">Total Invoices</span>
          <span className="stat-value">{stats.totalInvoices}</span>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-green"><HiOutlineCurrencyRupee /></div>
          <span className="stat-label">Revenue (Paid)</span>
          <span className="stat-value">₹{stats.totalRevenue.toLocaleString()}</span>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-amber"><HiOutlineClock /></div>
          <span className="stat-label">Pending</span>
          <span className="stat-value">{stats.draftInvoices + stats.sentInvoices}</span>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Invoices</h2>
          <Link to="/invoices" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="glass-card empty-state">
            <HiOutlineDocumentText />
            <h3>No invoices yet</h3>
            <p>Create your first invoice to get started</p>
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
                </tr>
              </thead>
              <tbody>
                {recent.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <Link to={`/invoices/${inv._id}`} style={{ color: 'var(--accent-primary-hover)' }}>
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>{inv.client?.name || '—'}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{inv.total?.toLocaleString()}</td>
                    <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
