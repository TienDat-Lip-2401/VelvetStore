import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingBag, FiHeart, FiUser, FiMenu, FiX, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/san-pham?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-inner container">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <Link to="/" className="logo">
          <span className="logo-text">VELVET</span>
          <span className="logo-accent">STORE</span>
        </Link>

        <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>
          <Link to="/san-pham" onClick={() => setMobileMenuOpen(false)}>Sản phẩm</Link>
          <Link to="/giam-gia" onClick={() => setMobileMenuOpen(false)}>Khuyến mãi</Link>
          <Link to="/bai-viet" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
          <Link to="/lien-he" onClick={() => setMobileMenuOpen(false)}>Liên hệ</Link>
        </nav>

        <div className="header-actions">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit"><FiSearch size={18} /></button>
          </form>

          {user && (
            <Link to="/yeu-thich" className="action-btn" title="Yêu thích">
              <FiHeart size={20} />
            </Link>
          )}

          <Link to="/gio-hang" className="action-btn cart-btn" title="Giỏ hàng">
            <FiShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="user-menu-wrapper">
              <button className="action-btn user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <FiUser size={20} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="user-menu-overlay" onClick={() => setUserMenuOpen(false)} />
                  <div className="user-menu">
                    <div className="user-menu-header">
                      <strong>{user.fullName}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/tai-khoan" onClick={() => setUserMenuOpen(false)}>
                      <FiUser size={16} /> Tài khoản
                    </Link>
                    <Link to="/don-hang" onClick={() => setUserMenuOpen(false)}>
                      <FiPackage size={16} /> Đơn hàng
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}>
                        <FiSettings size={16} /> Quản trị
                      </Link>
                    )}
                    <button onClick={handleLogout}>
                      <FiLogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/dang-nhap" className="btn btn-primary btn-sm header-login-btn">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
