import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePrinter, HiOutlinePencil, HiOutlineEnvelope } from 'react-icons/hi2';
import './InvoiceDetail.css';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/invoices/${id}`).then(({ data }) => {
      setInvoice(data.data);
    }).catch(() => {
      toast.error('Invoice not found');
      navigate('/invoices');
    }).finally(() => {
      setLoading(false);
    });
  }, [id, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleSend = () => {
    // In a real app, this would trigger an email
    toast.success('Invoice sent to client!');
    api.patch(`/invoices/${id}`, { status: 'sent' }).then(() => {
      setInvoice({ ...invoice, status: 'sent' });
    });
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (!invoice) return null;

  return (
    <div className="invoice-detail-page animate-in">
      <div className="detail-actions no-print">
        <Link to="/invoices" className="btn btn-ghost btn-sm">
          <HiOutlineArrowLeft /> Back
        </Link>
        <div className="action-group">
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <HiOutlinePrinter /> Print / PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleSend} disabled={invoice.status === 'paid'}>
            <HiOutlineEnvelope /> Send
          </button>
          <Link to={`/invoices/${id}/edit`} className="btn btn-primary btn-sm">
            <HiOutlinePencil /> Edit
          </Link>
        </div>
      </div>

      <div className="glass-card invoice-paper">
        <div className="invoice-header">
          <div>
            <div className="invoice-brand">
              <span className="brand-icon">⚡</span> InvoiceGen
            </div>
          </div>
          <div className="invoice-meta">
            <h1>INVOICE</h1>
            <p className="invoice-number">#{invoice.invoiceNumber}</p>
            <span className={`badge badge-${invoice.status}`}>{invoice.status}</span>
          </div>
        </div>

        <div className="invoice-info-grid">
          <div className="info-block">
            <h3>Billed To</h3>
            <p className="strong">{invoice.client?.name}</p>
            <p>{invoice.client?.email}</p>
            {invoice.client?.company && <p>{invoice.client?.company}</p>}
            {invoice.client?.address && <p>{invoice.client?.address}</p>}
          </div>
          <div className="info-block info-right">
            <div className="info-row">
              <span>Date:</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span>Due Date:</span>
              <span className="strong">{new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="invoice-items">
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems?.map((item: any) => (
                <tr key={item._id}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.rate.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>
                    ₹{(item.quantity * item.rate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{(invoice.total / (1 + invoice.taxRate / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="summary-row">
            <span>Tax ({invoice.taxRate}%)</span>
            <span>₹{(invoice.total - invoice.total / (1 + invoice.taxRate / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total Due</span>
            <span>₹{invoice.total.toLocaleString()}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="invoice-notes">
            <h4>Notes</h4>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
