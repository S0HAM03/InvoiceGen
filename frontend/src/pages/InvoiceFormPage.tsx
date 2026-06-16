import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi2';
import './InvoiceForm.css';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

interface Client {
  _id: string;
  name: string;
}

export default function InvoiceFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [form, setForm] = useState({
    client: '',
    invoiceNumber: '',
    status: 'draft',
    dueDate: '',
    taxRate: 18,
    notes: '',
  });
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0 },
  ]);

  useEffect(() => {
    api.get('/clients?limit=100').then(({ data }) => {
      setClients(data.data.clients || []);
    }).catch(() => {});

    if (isEdit) {
      api.get(`/invoices/${id}`).then(({ data }) => {
        const inv = data.data;
        setForm({
          client: inv.client?._id || inv.client || '',
          invoiceNumber: inv.invoiceNumber || '',
          status: inv.status || 'draft',
          dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : '',
          taxRate: inv.taxRate ?? 18,
          notes: inv.notes || '',
        });
        if (inv.lineItems?.length) {
          setItems(inv.lineItems.map((li: any) => ({
            description: li.description, quantity: li.quantity, rate: li.rate,
          })));
        }
      }).catch(() => {
        toast.error('Invoice not found');
        navigate('/invoices');
      });
    }
  }, [id]);

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  const taxAmount = subtotal * (form.taxRate / 100);
  const total = subtotal + taxAmount;

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.client) { toast.error('Select a client'); return; }
    if (!items.some((i) => i.description && i.rate > 0)) {
      toast.error('Add at least one line item');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        client: form.client,
        invoiceNumber: form.invoiceNumber,
        status: form.status,
        dueDate: form.dueDate,
        taxRate: Number(form.taxRate),
        notes: form.notes,
        lineItems: items.filter((i) => i.description),
      };
      if (isEdit) {
        await api.patch(`/invoices/${id}`, payload);
        toast.success('Invoice updated');
      } else {
        await api.post('/invoices', payload);
        toast.success('Invoice created');
      }
      navigate('/invoices');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invoice-form-page animate-in">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
          <p>{isEdit ? 'Update invoice details' : 'Create a new invoice for your client'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="glass-card form-card">
          <h2 className="form-section-title">Invoice Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="inv-client">Client *</label>
              <select
                id="inv-client"
                className="form-select"
                value={form.client}
                onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                required
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-number">Invoice Number</label>
              <input id="inv-number" className="form-input" value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} placeholder="INV-001 (auto if empty)" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-status">Status</label>
              <select id="inv-status" className="form-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-due">Due Date *</label>
              <input id="inv-due" className="form-input" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-tax">Tax Rate (%)</label>
              <input id="inv-tax" className="form-input" type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        <div className="glass-card form-card" style={{ marginTop: 20 }}>
          <div className="form-section-header">
            <h2 className="form-section-title">Line Items</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
              <HiOutlinePlus /> Add Item
            </button>
          </div>

          <div className="line-items-table">
            <div className="line-item-header">
              <span>Description</span>
              <span>Qty</span>
              <span>Rate (₹)</span>
              <span>Amount</span>
              <span></span>
            </div>
            {items.map((item, index) => (
              <div key={index} className="line-item-row">
                <input
                  className="form-input"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Item description"
                />
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                />
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                />
                <span className="line-item-amount">₹{(item.quantity * item.rate).toLocaleString()}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeItem(index)}
                  disabled={items.length <= 1}
                >
                  <HiOutlineTrash />
                </button>
              </div>
            ))}
          </div>

          <div className="invoice-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="total-row">
              <span>Tax ({form.taxRate}%)</span>
              <span>₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="total-row total-final">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="glass-card form-card" style={{ marginTop: 20 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="inv-notes">Notes</label>
            <textarea id="inv-notes" className="form-textarea" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional notes for the client..." />
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/invoices')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
