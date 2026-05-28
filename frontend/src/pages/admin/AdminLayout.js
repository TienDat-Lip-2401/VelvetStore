import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiBox, FiLayers, FiShoppingBag, FiUsers, FiTag,
  FiStar, FiFileText, FiMail, FiTruck, FiSettings, FiBarChart2,
  FiLogOut, FiAward, FiFeather
} from 'react-icons/fi';
import './AdminLayout.css';

const sidebarLinks = [
  { to: '/admin', icon: <FiGrid size={18} />, label: 'Dashboard', end: true },
  { to: '/admin/san-pham', icon: <FiBox size={18} />, label: 'Sản phẩm' },
  { to: '/admin/danh-muc', icon: <FiLayers size={18} />, label: 'Danh mục' },
  { to: '/admin/thuong-hieu', icon: <FiAward size={18} />, label: 'Thương hiệu' },
  { to: '/admin/chat-lieu', icon: <FiFeather size={18} />, label: 'Chất liệu' },
  { to: '/admin/don-hang', icon: <FiShoppingBag size={18} />, label: 'Đơn hàng' },
  { to: '/admin/khach-hang', icon: <FiUsers size={18} />, label: 'Khách hàng' },
  { to: '/admin/voucher', icon: <FiTag size={18} />, label: 'Mã giảm giá' },
  { to: '/admin/danh-gia', icon: <FiStar size={18} />, label: 'Đánh giá' },
  { to: '/admin/bai-viet', icon: <FiFileText size={18} />, label: 'Bài viết' },
  { to: '/admin/bao-cao', icon: <FiBarChart2 size={18} />, label: 'Báo cáo' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2 className="admin-logo">VelvetStore</h2>
          <span className="admin-badge">Quản trị</span>
        </div>

        <nav className="admin-nav">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <span className="admin-user-name">{user.name || user.email}</span>
            <span className="admin-user-role">Quản trị viên</span>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <FiLogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
