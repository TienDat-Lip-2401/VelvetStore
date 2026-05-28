import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiChevronDown, FiChevronUp, FiFilter } from 'react-icons/fi';
import { adminAPI } from '../../api';
import { formatPrice } from '../../utils/formatPrice';
import { useModal } from '../../context/ModalContext';
import './AdminOrdersPage.css';

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const statusOptions = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

const AdminOrdersPage = () => {
  const { showModal: showWarning } = useModal();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllOrders({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
      });
      setOrders(res.orders || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      await adminAPI.updateOrderStatus(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      showWarning('Lỗi khi cập nhật trạng thái đơn hàng', 'danger');
    } finally {
      setUpdating(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading && orders.length === 0 && !searchQuery) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý đơn hàng</h1>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-form">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm mã đơn, tên khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-search" onClick={() => { setSearchQuery(''); setSearch(''); setPage(1); }}>
              <FiX />
            </button>
          )}
        </form>

        <div className="status-filter">
          <FiFilter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="admin-table orders-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-text">Không có đơn hàng nào</td>
              </tr>
            ) : (
              orders.map((order) => (
                <>
                  <tr key={order.id} className={expandedId === order.id ? 'row-expanded' : ''}>
                    <td className="order-code">#{order.orderCode || order.id}</td>
                    <td>{order.user?.fullName || order.fullName || 'N/A'}</td>
                    <td className="order-total">{formatPrice(order.total || 0)}</td>
                    <td>
                      <select
                        className={`status-select status-${order.status}`}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updating === order.id || order.status === 'cancelled' || order.status === 'delivered'}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{statusLabels[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <button
                        className="btn-icon btn-expand"
                        onClick={() => toggleExpand(order.id)}
                        title="Xem chi tiết"
                      >
                        {expandedId === order.id ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr key={`detail-${order.id}`} className="order-detail-row">
                      <td colSpan="6">
                        <div className="order-detail">
                          <div className="detail-section">
                            <h4>Thông tin giao hàng</h4>
                            <p><strong>Người nhận:</strong> {order.fullName || order.user?.fullName || 'N/A'}</p>
                            <p><strong>Số điện thoại:</strong> {order.phone || order.user?.phone || 'N/A'}</p>
                            <p><strong>Địa chỉ:</strong> {order.address || 'N/A'}</p>
                            <p><strong>Ghi chú:</strong> {order.note || 'Không có'}</p>
                          </div>
                          <div className="detail-section">
                            <h4>Sản phẩm</h4>
                            {(order.items || []).length > 0 ? (
                              <table className="detail-items-table">
                                <thead>
                                  <tr>
                                    <th>Sản phẩm</th>
                                    <th>Size</th>
                                    <th>Màu</th>
                                    <th>SL</th>
                                    <th>Giá</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(order.items || []).map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{item.product?.name || item.productName || 'N/A'}</td>
                                      <td>{item.size || '---'}</td>
                                      <td>{item.color || '---'}</td>
                                      <td>{item.quantity}</td>
                                      <td>{formatPrice(item.price)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-muted">Không có thông tin sản phẩm</p>
                            )}
                          </div>
                          <div className="detail-summary">
                            <p><strong>Phương thức thanh toán:</strong> {order.paymentMethod === 'vnpay' ? 'VNPay' : order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod || 'N/A'}</p>
                            <p><strong>Phí vận chuyển:</strong> {formatPrice(order.shippingFee || 0)}</p>
                            <p className="detail-total"><strong>Tổng cộng:</strong> {formatPrice(order.total || 0)}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau</button>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
