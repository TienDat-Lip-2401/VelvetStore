import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiTrash2, FiPlus, FiMinus, FiTag, FiArrowRight, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { voucherAPI } from '../api';
import { formatPrice } from '../utils/formatPrice';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, cartLoading, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherInfo, setVoucherInfo] = useState(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.salePrice && Number(item.salePrice) < Number(item.price)
      ? Number(item.salePrice)
      : Number(item.price);
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = subtotal > 500000 ? 0 : 30000;
  const total = subtotal - voucherDiscount + shippingFee;

  const handleQuantityChange = async (id, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    try {
      await updateQuantity(id, newQty);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật số lượng thất bại');
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      await removeItem(id);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (err) {
      toast.error('Xóa sản phẩm thất bại');
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.warning('Vui lòng nhập mã giảm giá');
      return;
    }
    setApplyingVoucher(true);
    try {
      const res = await voucherAPI.validate({ code: voucherCode.trim(), orderTotal: subtotal });
      setVoucherDiscount(res.discount || 0);
      setVoucherInfo(res);
      toast.success('Áp dụng mã giảm giá thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ');
      setVoucherDiscount(0);
      setVoucherInfo(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setVoucherDiscount(0);
    setVoucherInfo(null);
  };

  const handleCheckout = () => {
    navigate('/thanh-toan', {
      state: {
        voucherCode: voucherInfo ? voucherCode : null,
        voucherDiscount,
      },
    });
  };

  if (cartLoading) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="loading-text">Đang tải giỏ hàng...</div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-state cart-empty">
            <FiShoppingBag size={64} />
            <h3>Giỏ hàng trống</h3>
            <p>Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm của chúng tôi!</p>
            <Link to="/san-pham" className="btn btn-primary btn-lg">
              Tiếp tục mua sắm
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1 className="cart-title">Giỏ hàng của bạn</h1>
          <span className="cart-count">{cartItems.length} sản phẩm</span>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            <div className="cart-items-header">
              <span className="col-product">Sản phẩm</span>
              <span className="col-price">Đơn giá</span>
              <span className="col-quantity">Số lượng</span>
              <span className="col-subtotal">Thành tiền</span>
              <span className="col-action"></span>
            </div>

            {cartItems.map((item) => {
              const itemPrice = item.salePrice && Number(item.salePrice) < Number(item.price)
                ? Number(item.salePrice)
                : Number(item.price);
              const imageUrl = item.image || item.productImage || 'https://placehold.co/120x150/f8f9fa/9ca3af?text=No+Image';

              return (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-product">
                    <Link to={`/san-pham/${item.productSlug || item.productId}`} className="cart-item-image">
                      <img src={imageUrl} alt={item.productName || item.name} />
                    </Link>
                    <div className="cart-item-info">
                      <Link to={`/san-pham/${item.productSlug || item.productId}`} className="cart-item-name">
                        {item.productName || item.name}
                      </Link>
                      <div className="cart-item-variants">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Màu: {item.color}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="cart-item-price">
                    <span className="cart-price-label">Đơn giá:</span>
                    {item.salePrice && Number(item.salePrice) < Number(item.price) ? (
                      <div className="cart-price-group">
                        <span className="price-sale">{formatPrice(item.salePrice)}</span>
                        <span className="price-original">{formatPrice(item.price)}</span>
                      </div>
                    ) : (
                      <span className="price-current">{formatPrice(item.price)}</span>
                    )}
                  </div>

                  <div className="cart-item-quantity">
                    <span className="cart-price-label">Số lượng:</span>
                    <div className="quantity-selector">
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-subtotal">
                    <span className="cart-price-label">Thành tiền:</span>
                    <span className="subtotal-value">{formatPrice(itemPrice * item.quantity)}</span>
                  </div>

                  <div className="cart-item-action">
                    <button
                      className="cart-remove-btn"
                      onClick={() => handleRemoveItem(item.id)}
                      title="Xóa sản phẩm"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="cart-continue">
              <Link to="/san-pham" className="btn btn-outline">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          <div className="cart-sidebar">
            <div className="cart-summary card">
              <h3 className="cart-summary-title">Tóm tắt đơn hàng</h3>

              <div className="voucher-section">
                <label className="voucher-label">
                  <FiTag size={14} />
                  Mã giảm giá
                </label>
                {voucherInfo ? (
                  <div className="voucher-applied">
                    <span className="voucher-code-display">{voucherCode}</span>
                    <span className="voucher-discount-text">-{formatPrice(voucherDiscount)}</span>
                    <button className="voucher-remove-btn" onClick={handleRemoveVoucher}>
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="voucher-input-group">
                    <input
                      type="text"
                      className="form-control voucher-input"
                      placeholder="Nhập mã giảm giá"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                    />
                    <button
                      className="btn btn-outline voucher-apply-btn"
                      onClick={handleApplyVoucher}
                      disabled={applyingVoucher}
                    >
                      {applyingVoucher ? 'Đang áp dụng...' : 'Áp dụng'}
                    </button>
                  </div>
                )}
              </div>

              <div className="summary-lines">
                <div className="summary-line">
                  <span>Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="summary-line summary-discount">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(voucherDiscount)}</span>
                  </div>
                )}
                <div className="summary-line">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
                </div>
                {shippingFee > 0 && (
                  <p className="free-shipping-note">Miễn phí vận chuyển cho đơn hàng từ {formatPrice(500000)}</p>
                )}
                <div className="summary-line summary-total">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button className="btn btn-accent btn-lg cart-checkout-btn" onClick={handleCheckout}>
                Tiến hành thanh toán
                <FiArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
