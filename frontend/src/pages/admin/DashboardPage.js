import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiDollarSign, FiShoppingBag, FiClock, FiUserPlus, FiTrendingUp } from 'react-icons/fi';
import { adminAPI } from '../../api';
import { formatPrice } from '../../utils/formatPrice';
import './DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes, sellersRes] = await Promise.all([
          adminAPI.getOrderStats(),
          adminAPI.getAllOrders({ limit: 5 }),
          adminAPI.getBestSellers(),
        ]);
        setStats(statsRes.stats);
        setRecentOrders(ordersRes.orders || []);
        setBestSellers(sellersRes.products || []);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };

  const statusClasses = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    shipping: 'status-shipping',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="spinner" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Tổng Quan</h1>
        <p className="dashboard-subtitle">Xin chào! Đây là tổng quan hoạt động hôm nay.</p>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-stats">
        <div className="stat-card stat-revenue">
          <div className="stat-icon">
            <FiDollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Doanh thu hôm nay</span>
            <span className="stat-value">{formatPrice(stats?.todayRevenue || 0)}</span>
          </div>
        </div>

        <div className="stat-card stat-orders">
          <div className="stat-icon">
            <FiShoppingBag size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đơn hàng hôm nay</span>
            <span className="stat-value">{stats?.todayOrders || 0}</span>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">
            <FiClock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đơn chờ xử lý</span>
            <span className="stat-value">{stats?.pendingOrders || 0}</span>
          </div>
        </div>

        <div className="stat-card stat-customers">
          <div className="stat-icon">
            <FiUserPlus size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Khách hàng mới</span>
            <span className="stat-value">{stats?.newCustomers || 0}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Orders */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Đơn Hàng Gần Đây</h2>
            <Link to="/admin/don-hang" className="dashboard-card-link">
              Xem tất cả
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-code">#{order.id}</td>
                      <td>{order.user?.fullName || order.fullName || 'N/A'}</td>
                      <td className="order-total">{formatPrice(order.total)}</td>
                      <td>
                        <span className={`order-status ${statusClasses[order.status] || ''}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="dashboard-empty">Chưa có đơn hàng nào.</p>
          )}
        </div>

        {/* Best Sellers */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Sản Phẩm Bán Chạy</h2>
            <FiTrendingUp size={18} className="header-icon" />
          </div>

          {bestSellers.length > 0 ? (
            <div className="bestseller-list">
              {bestSellers.slice(0, 5).map((item, index) => (
                <div key={item.id || index} className="bestseller-item">
                  <span className="bestseller-rank">#{index + 1}</span>
                  <div className="bestseller-image">
                    <img
                      src={item.images?.[0]?.url || 'https://placehold.co/48x48/f0f0f0/999?text=SP'}
                      alt={item.name}
                    />
                  </div>
                  <div className="bestseller-info">
                    <span className="bestseller-name">{item.name}</span>
                    <span className="bestseller-sold">
                      Đã bán: {item.totalSold || 0}
                    </span>
                  </div>
                  <span className="bestseller-price">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Chưa có dữ liệu bán hàng.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
