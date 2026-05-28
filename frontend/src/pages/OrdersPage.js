import { useState, useEffect } from 'react';
import { orderAPI } from '../api';
import { formatPrice } from '../utils/formatPrice';
import { toast } from 'react-toastify';
import { FiPackage, FiChevronDown, FiChevronUp, FiShoppingBag } from 'react-icons/fi';
import { Link, useLocation, useParams } from 'react-router-dom';
import './OrdersPage.css';

const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', class: 'badge-warning' },
  confirmed: { label: 'Đã xác nhận', class: 'badge-info' },
  shipping: { label: 'Đang giao hàng', class: 'badge-info' },
  delivered: { label: 'Đã giao hàng', class: 'badge-success' },
  cancelled: { label: 'Đã hủy', class: 'badge-danger' },
};

const OrdersPage = () => {
  const location = useLocation();
  const { id: paramId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(paramId ? Number(paramId) : null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (location.state?.orderSuccess) {
      const orderId = location.state.orderId || paramId;
      if (orderId) setExpandedId(Number(orderId));
      toast.success('Đặt hàng thành công!');
    } else if (paramId) {
      setExpandedId(Number(paramId));
    }
  }, [location.state, paramId]);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res.orders || res);
    } catch {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    try {
      await orderAPI.cancel(orderId);
      toast.success('Đã hủy đơn hàng');
      fetchOrders();
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể hủy đơn hàng';
      toast.error(message);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status) => {
    return STATUS_MAP[status] || { label: status, class: 'badge-default' };
  };

  const getItemCount = (order) => {
    if (order.items) return order.items.length;
    if (order.orderItems) return order.orderItems.length;
    return 0;
  };

  const getOrderItems = (order) => {
    return order.items || order.orderItems || [];
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="loading-text">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title">Đơn hàng của tôi</h1>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <FiShoppingBag size={48} />
            <h3>Chưa có đơn hàng nào</h3>
            <p>Bạn chưa đặt đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
            <Link to="/san-pham" className="btn btn-primary">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const isExpanded = expandedId === order.id;
              const items = getOrderItems(order);
              const itemCount = getItemCount(order);

              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header" onClick={() => toggleExpand(order.id)}>
                    <div className="order-header-left">
                      <div className="order-icon">
                        <FiPackage size={20} />
                      </div>
                      <div className="order-header-info">
                        <div className="order-code">
                          {order.orderCode || `DH-${order.id}`}
                        </div>
                        <div className="order-date">{formatDate(order.createdAt)}</div>
                      </div>
                    </div>
                    <div className="order-header-right">
                      <div className="order-header-meta">
                        <span className={`badge ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                        <span className="order-total">{formatPrice(order.totalAmount || order.total)}</span>
                        <span className="order-items-count">{itemCount} sản phẩm</span>
                      </div>
                      <span className="order-expand-icon">
                        {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="order-card-body">
                      {items.length > 0 && (
                        <div className="order-items">
                          {items.map((item, idx) => {
                            const product = item.product || item;
                            const imageUrl = item.image || product.images?.[0]?.url || 'https://placehold.co/80x80/f8f9fa/9ca3af?text=SP';
                            return (
                              <div key={idx} className="order-item">
                                <img
                                  className="order-item-image"
                                  src={imageUrl}
                                  alt={item.productName || product.name}
                                />
                                <div className="order-item-info">
                                  <p className="order-item-name">
                                    {item.productName || product.name}
                                  </p>
                                  <p className="order-item-variant">
                                    {item.size && `Size: ${item.size}`}
                                    {item.size && item.color && ' - '}
                                    {item.color && `Màu: ${item.color}`}
                                  </p>
                                  <p className="order-item-qty">
                                    Số lượng: {item.quantity}
                                  </p>
                                </div>
                                <div className="order-item-price">
                                  {formatPrice(item.price)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="order-card-footer">
                        <div className="order-summary">
                          {order.shippingFee !== undefined && (
                            <div className="order-summary-row">
                              <span>Phí vận chuyển:</span>
                              <span>{formatPrice(order.shippingFee)}</span>
                            </div>
                          )}
                          {order.discount !== undefined && order.discount > 0 && (
                            <div className="order-summary-row">
                              <span>Giảm giá:</span>
                              <span className="text-danger">-{formatPrice(order.discount)}</span>
                            </div>
                          )}
                          <div className="order-summary-row order-summary-total">
                            <span>Tổng cộng:</span>
                            <span>{formatPrice(order.totalAmount || order.total)}</span>
                          </div>
                        </div>

                        {order.status === 'pending' && (
                          <button
                            className="btn btn-danger-outline"
                            onClick={() => handleCancel(order.id)}
                          >
                            Hủy đơn hàng
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
