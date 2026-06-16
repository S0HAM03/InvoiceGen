import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { HiOutlineUsers, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';
import './Clients.css';

interface Client {
  _id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients?limit=50');
      setClients(Array.isArray(data.data) ? data.data : data.data.clients || []);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete client "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      setClients((prev) => prev.filter((c) => c._id !== id));
    } catch {
      toast.error('Failed to delete client');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /> Loading clients...</div>;
  }

  return (
    <div className="clients-page animate-in">
      <div className="page-header">
        <div>
          <h1>Clients</h1>
          <p>Manage your client directory</p>
        </div>
        <Link to="/clients/new" className="btn btn-primary">+ Add Client</Link>
      </div>

      {clients.length === 0 ? (
        <div className="glass-card empty-state">
          <HiOutlineUsers />
          <h3>No clients yet</h3>
          <p>Add your first client to start creating invoices</p>
          <Link to="/clients/new" className="btn btn-primary">Add Client</Link>
        </div>
      ) : (
        <div className="clients-grid">
          {clients.map((client) => (
            <div key={client._id} className="glass-card client-card">
              <div className="client-avatar">{client.name.charAt(0).toUpperCase()}</div>
              <div className="client-info">
                <h3>{client.name}</h3>
                <p className="client-email">{client.email}</p>
                {client.company && <p className="client-company">{client.company}</p>}
              </div>
              <div className="client-actions">
                <Link to={`/clients/${client._id}/edit`} className="btn btn-ghost btn-sm" title="Edit">
                  <HiOutlinePencil />
                </Link>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(client._id, client.name)} title="Delete">
                  <HiOutlineTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
