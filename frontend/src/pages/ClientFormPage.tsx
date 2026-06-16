import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './ClientForm.css';

export default function ClientFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', address: '',
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/clients/${id}`).then(({ data }) => {
        const c = data.data;
        setForm({ name: c.name, email: c.email, phone: c.phone || '', company: c.company || '', address: c.address || '' });
      }).catch(() => {
        toast.error('Client not found');
        navigate('/clients');
      });
    }
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/clients/${id}`, form);
        toast.success('Client updated');
      } else {
        await api.post('/clients', form);
        toast.success('Client created');
      }
      navigate('/clients');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="client-form-page animate-in">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Client' : 'New Client'}</h1>
          <p>{isEdit ? 'Update client details' : 'Add a new client to your directory'}</p>
        </div>
      </div>

      <form className="glass-card form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="client-name">Name *</label>
            <input id="client-name" className="form-input" value={form.name} onChange={onChange('name')} required placeholder="Client name" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="client-email">Email *</label>
            <input id="client-email" className="form-input" type="email" value={form.email} onChange={onChange('email')} required placeholder="client@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="client-phone">Phone</label>
            <input id="client-phone" className="form-input" value={form.phone} onChange={onChange('phone')} placeholder="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="client-company">Company</label>
            <input id="client-company" className="form-input" value={form.company} onChange={onChange('company')} placeholder="Company name" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="client-address">Address</label>
          <textarea id="client-address" className="form-textarea" value={form.address} onChange={onChange('address')} placeholder="Full address" />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/clients')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
}
