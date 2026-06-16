import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Profile.css';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', { name });
      toast.success('Profile updated');
      // This will force a context refresh if the endpoint returned updated user data
      // For simplicity, we just reload or rely on next fetch
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await api.put('/users/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="profile-page animate-in">
      <div className="page-header">
        <div>
          <h1>Profile Settings</h1>
          <p>Manage your account preferences</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="glass-card profile-card">
          <h2>Personal Information</h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">Email Address</label>
              <input id="profile-email" className="form-input" value={user?.email || ''} disabled />
              <small className="form-help">Email cannot be changed</small>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <input id="profile-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || name === user?.name}>
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        <div className="glass-card profile-card">
          <h2>Change Password</h2>
          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="current-pass">Current Password</label>
              <input id="current-pass" type="password" className="form-input" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-pass">New Password</label>
              <input id="new-pass" type="password" className="form-input" minLength={8} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pass">Confirm New Password</label>
              <input id="confirm-pass" type="password" className="form-input" minLength={8} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-secondary">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
