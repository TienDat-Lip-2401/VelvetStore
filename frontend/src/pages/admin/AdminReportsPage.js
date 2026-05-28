import { useState, useEffect } from 'react';
import { FiCalendar, FiTrendingUp, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import { adminAPI } from '../../api';
import { formatPrice } from '../../utils/formatPrice';
import './AdminReportsPage.css';

const AdminReportsPage = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: new Date().toISOString().slice(0, 10),
  });

  function getDefaultStartDate() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  }

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'revenue') {
        const res = await adminAPI.getRevenueReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        // Transform { labels, data, orderCounts } into revenue summary format
        const labels = res.labels || [];
        const dataArr = res.data || [];
        const orderCounts = res.orderCounts || [];
        const totalRevenue = dataArr.reduce((sum, v) => sum + (v || 0), 0);
        const totalOrders = orderCounts.reduce((sum, v) => sum + (v || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const details = labels.map((label, i) => ({ date: label, revenue: dataArr[i] || 0 }));
        setRevenue({ totalRevenue, totalOrders, averageOrderValue, details });
      } else if (activeTab === 'bestsellers') {
        const res = await adminAPI.getBestSellers();
        setBestSellers(res.products || []);
      } else if (activeTab === 'lowstock') {
        const res = await adminAPI.getLowStock();
        // Flatten products with variants for display
        const items = [];
        (res.products || []).forEach((product) => {
          if (product.variants && product.variants.length > 0) {
            product.variants.forEach((variant) => {
              items.push({
                id: `${product.id}-${variant.size}-${variant.color}`,
                name: product.name,
                size: variant.size,
                color: variant.color,
                stock: variant.stock,
              });
            });
          } else {
            items.push({
              id: product.id,
              name: product.name,
              size: '---',
              color: '---',
              stock: product.totalStock || 0,
            });
          }
        });
        setLowStock(items);
      }
    } catch (err) {
      console.error('Lỗi khi tải báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    if (activeTab === 'revenue') fetchTabData();
  };

  const getMaxRevenue = () => {
    if (!revenue?.details) return 1;
    return Math.max(...revenue.details.map((d) => d.revenue || d.total || 0), 1);
  };

  const tabs = [
    { id: 'revenue', label: 'Doanh thu', icon: FiDollarSign },
    { id: 'bestsellers', label: 'Bán chạy', icon: FiTrendingUp },
    { id: 'lowstock', label: 'Sắp hết hàng', icon: FiAlertTriangle },
  ];

  return (
    <div className="admin-reports-page">
      <div className="page-header">
        <h1 className="page-title">Báo cáo & Thống kê</h1>
      </div>

      <div className="report-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`report-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="report-section">
          <div className="date-filter">
            <div className="date-input-group">
              <FiCalendar />
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
              <span className="date-separator">đến</span>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
              />
            </div>
            <button className="btn-primary btn-sm" onClick={handleFilter}>
              Xem báo cáo
            </button>
          </div>

          {loading ? (
            <div className="admin-loading">
              <div className="spinner" />
              <p>Đang tải...</p>
            </div>
          ) : (
            <>
              <div className="revenue-summary">
                <div className="summary-card">
                  <span className="summary-label">Tổng doanh thu</span>
                  <span className="summary-value revenue-total">
                    {formatPrice(revenue?.totalRevenue || 0)}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Tổng đơn hàng</span>
                  <span className="summary-value">{revenue?.totalOrders || 0}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Giá trị trung bình</span>
                  <span className="summary-value">
                    {formatPrice(revenue?.averageOrderValue || 0)}
                  </span>
                </div>
              </div>

              {revenue?.details && revenue.details.length > 0 && (
                <div className="revenue-chart">
                  <h3>Chi tiết doanh thu</h3>
                  <div className="bar-chart">
                    {revenue.details.map((d, idx) => (
                      <div className="bar-item" key={idx}>
                        <div className="bar-label">{d.date || d.period || `Kỳ ${idx + 1}`}</div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${((d.revenue || d.total || 0) / getMaxRevenue()) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="bar-value">{formatPrice(d.revenue || d.total || 0)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Best Sellers Tab */}
      {activeTab === 'bestsellers' && (
        <div className="report-section">
          {loading ? (
            <div className="admin-loading">
              <div className="spinner" />
              <p>Đang tải...</p>
            </div>
          ) : bestSellers.length === 0 ? (
            <div className="empty-text">Chưa có dữ liệu sản phẩm bán chạy</div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hình ảnh</th>
                    <th>Sản phẩm</th>
                    <th>Giá</th>
                    <th>Đã bán</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="rank-cell">{idx + 1}</td>
                      <td>
                        {item.images?.[0]?.url ? (
                          <img
                            src={item.images[0].url}
                            alt={item.name}
                            className="report-thumb"
                          />
                        ) : (
                          <div className="report-thumb-empty">---</div>
                        )}
                      </td>
                      <td className="product-name-cell">{item.name}</td>
                      <td>{formatPrice(item.price || 0)}</td>
                      <td className="sold-cell">{item.totalSold || 0}</td>
                      <td className="revenue-cell">
                        {formatPrice((item.totalSold || 0) * (item.price || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Low Stock Tab */}
      {activeTab === 'lowstock' && (
        <div className="report-section">
          {loading ? (
            <div className="admin-loading">
              <div className="spinner" />
              <p>Đang tải...</p>
            </div>
          ) : lowStock.length === 0 ? (
            <div className="empty-text">Không có sản phẩm nào sắp hết hàng</div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Size</th>
                    <th>Màu</th>
                    <th>Tồn kho</th>
                    <th>Cảnh báo</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="product-name-cell">
                        {item.name || 'N/A'}
                      </td>
                      <td>{item.size || '---'}</td>
                      <td>{item.color || '---'}</td>
                      <td>
                        <span className={`stock-count ${(item.stock || 0) <= 5 ? 'critical' : 'low'}`}>
                          {item.stock || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`stock-alert ${(item.stock || 0) <= 5 ? 'critical' : 'warning'}`}>
                          {(item.stock || 0) <= 5 ? 'Sắp hết' : 'Tồn kho thấp'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
