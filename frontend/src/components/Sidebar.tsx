import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
  { to: '/clients', icon: HiOutlineUsers, label: 'Clients' },
  { to: '/invoices', icon: HiOutlineDocumentText, label: 'Invoices' },
  { to: '/profile', icon: HiOutlineUser, label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">InvoiceGen</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-email">{user?.email || ''}</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
          <HiOutlineArrowRightOnRectangle />
        </button>
      </div>
    </aside>
  );
}
