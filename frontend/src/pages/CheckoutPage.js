import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMapPin, FiCreditCard, FiCheckCircle, FiPlus, FiChevronRight, FiTruck, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, addressAPI, paymentAPI, voucherAPI } from '../api';
import { formatPrice } from '../utils/formatPrice';
import useProvinces from '../hooks/useProvinces';
import './CheckoutPage.css';

const STEPS = [
  { id: 1, label: 'Địa chỉ giao hàng', icon: FiMapPin },
  { id: 2, label: 'Phương thức thanh toán', icon: FiCreditCard },
  { id: 3, label: 'Xác nhận đơn hàng', icon: FiCheckCircle },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    street: '',
  });
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const {
    provinces, districts, wards,
    loadingProvinces, loadingDistricts, loadingWards,
    fetchDistricts, fetchWards,
  } = useProvinces();

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const prov = provinces.find((p) => String(p.code) === code);
    setSelectedProvinceCode(code);
    setSelectedDistrictCode('');
    setNewAddress({ ...newAddress, province: prov ? prov.name : '', district: '', ward: '' });
    fetchDistricts(code);
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    const dist = districts.find((d) => String(d.code) === code);
    setSelectedDistrictCode(code);
    setNewAddress({ ...newAddress, district: dist ? dist.name : '', ward: '' });
    fetchWards(code);
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const w = wards.find((w) => String(w.code) === code);
    setNewAddress({ ...newAddress, ward: w ? w.name : '' });
  };

  const voucherCode = location.state?.voucherCode || null;
  const voucherDiscount = location.state?.voucherDiscount || 0;

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.salePrice && Number(item.salePrice) < Number(item.price)
      ? Number(item.salePrice)
      : Number(item.price);
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = subtotal > 500000 ? 0 : 30000;
  const total = subtotal - voucherDiscount + shippingFee;

  useEffect(() => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập để thanh toán');
      navigate('/dang-nhap');
      return;
    }
    if (cartItems.length === 0) {
      navigate('/gio-hang');
      return;
    }
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await addressAPI.getAll();
      const list = res.addresses || res || [];
      setAddresses(list);
      const defaultAddr = list.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (list.length > 0) setSelectedAddressId(list[0].id);
    } catch {
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddAddress = async () => {
    const { fullName, phone, province, district, ward, street } = newAddress;
    if (!fullName || !phone || !province || !district || !ward || !street) {
      toast.warning('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }
    try {
      const res = await addressAPI.create(newAddress);
      const created = res.address || res;
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
      setNewAddress({ fullName: '', phone: '', province: '', district: '', ward: '', street: '' });
      toast.success('Thêm địa chỉ mới thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm địa chỉ thất bại');
    }
  };

  const goToStep = (step) => {
    if (step === 2 && !selectedAddressId) {
      toast.warning('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    if (step === 3 && !selectedAddressId) {
      toast.warning('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    setCurrentStep(step);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.warning('Vui lòng chọn địa chỉ giao hàng');
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        addressId: selectedAddressId,
        paymentMethod,
        voucherCode,
      };

      const res = await orderAPI.create(orderData);
      const order = res.order || res;

      if (paymentMethod === 'VNPAY') {
        try {
          const paymentRes = await paymentAPI.createVnpayUrl({
            orderId: order.id,
            amount: total,
          });
          const paymentUrl = paymentRes.paymentUrl || paymentRes.url;
          if (paymentUrl) {
            window.location.href = paymentUrl;
            return;
          }
          toast.error('Không thể tạo liên kết thanh toán VNPay');
        } catch (err) {
          toast.error('Lỗi kết nối cổng thanh toán VNPay');
        }
      } else {
        await clearCart();
        toast.success('Đặt hàng thành công!');
        navigate('/don-hang', {
          state: { orderSuccess: true, orderId: order.id },
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-title">Thanh toán</h1>

        {/* Step Indicator */}
        <div className="checkout-steps">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="checkout-step-wrapper">
                <div
                  className={`checkout-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                  onClick={() => currentStep > step.id && goToStep(step.id)}
                >
                  <div className="step-circle">
                    {currentStep > step.id ? <FiCheckCircle size={18} /> : <Icon size={18} />}
                  </div>
                  <span className="step-label">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && <div className="step-connector" />}
              </div>
            );
          })}
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">
                  <FiMapPin size={20} />
                  Chọn địa chỉ giao hàng
                </h2>

                {loadingAddresses ? (
                  <div className="loading-spinner"><div className="spinner" /></div>
                ) : (
                  <>
                    <div className="address-list">
                      {addresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`address-card card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={addr.id}
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="address-radio"
                          />
                          <div className="address-card-content">
                            <div className="address-card-header">
                              <span className="address-name">{addr.fullName}</span>
                              <span className="address-phone">{addr.phone}</span>
                              {addr.isDefault && <span className="badge badge-info">Mặc định</span>}
                            </div>
                            <p className="address-detail">
                              {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {!showAddressForm ? (
                      <button
                        className="btn btn-outline add-address-btn"
                        onClick={() => setShowAddressForm(true)}
                      >
                        <FiPlus size={16} />
                        Thêm địa chỉ mới
                      </button>
                    ) : (
                      <div className="new-address-form card">
                        <h3 className="form-section-title">Thêm địa chỉ mới</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Họ và tên</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Nguyễn Văn A"
                              value={newAddress.fullName}
                              onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Số điện thoại</label>
                            <input
                              type="tel"
                              className="form-control"
                              placeholder="0912 345 678"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="form-row form-row-3">
                          <div className="form-group">
                            <label>Tỉnh / Thành phố</label>
                            <select
                              className="form-control"
                              value={selectedProvinceCode}
                              onChange={handleProvinceChange}
                              disabled={loadingProvinces}
                            >
                              <option value="">{loadingProvinces ? 'Đang tải...' : '-- Chọn Tỉnh/Thành phố --'}</option>
                              {provinces.map((p) => (
                                <option key={p.code} value={p.code}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Quận / Huyện</label>
                            <select
                              className="form-control"
                              value={selectedDistrictCode}
                              onChange={handleDistrictChange}
                              disabled={!selectedProvinceCode || loadingDistricts}
                            >
                              <option value="">{loadingDistricts ? 'Đang tải...' : '-- Chọn Quận/Huyện --'}</option>
                              {districts.map((d) => (
                                <option key={d.code} value={d.code}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Phường / Xã</label>
                            <select
                              className="form-control"
                              value={wards.find((w) => w.name === newAddress.ward)?.code || ''}
                              onChange={handleWardChange}
                              disabled={!selectedDistrictCode || loadingWards}
                            >
                              <option value="">{loadingWards ? 'Đang tải...' : '-- Chọn Phường/Xã --'}</option>
                              {wards.map((w) => (
                                <option key={w.code} value={w.code}>{w.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Địa chỉ chi tiết</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Số nhà, tên đường..."
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          />
                        </div>
                        <div className="form-actions">
                          <button className="btn btn-primary" onClick={handleAddAddress}>
                            Lưu địa chỉ
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => setShowAddressForm(false)}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="step-navigation">
                      <div />
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={() => goToStep(2)}
                        disabled={!selectedAddressId}
                      >
                        Tiếp tục
                        <FiChevronRight />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">
                  <FiCreditCard size={20} />
                  Chọn phương thức thanh toán
                </h2>

                <div className="payment-methods">
                  <label className={`payment-method card ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="payment-radio"
                    />
                    <div className="payment-method-content">
                      <div className="payment-method-icon">
                        <FiTruck size={24} />
                      </div>
                      <div className="payment-method-info">
                        <span className="payment-method-name">Thanh toán khi nhận hàng (COD)</span>
                        <span className="payment-method-desc">
                          Thanh toán bằng tiền mặt khi nhận được hàng
                        </span>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-method card ${paymentMethod === 'VNPAY' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="VNPAY"
                      checked={paymentMethod === 'VNPAY'}
                      onChange={() => setPaymentMethod('VNPAY')}
                      className="payment-radio"
                    />
                    <div className="payment-method-content">
                      <div className="payment-method-icon">
                        <FiDollarSign size={24} />
                      </div>
                      <div className="payment-method-info">
                        <span className="payment-method-name">Thanh toán qua VNPay</span>
                        <span className="payment-method-desc">
                          Thanh toán trực tuyến qua thẻ ATM, Visa, MasterCard, QR Code
                        </span>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="step-navigation">
                  <button className="btn btn-outline btn-lg" onClick={() => goToStep(1)}>
                    Quay lại
                  </button>
                  <button className="btn btn-primary btn-lg" onClick={() => goToStep(3)}>
                    Tiếp tục
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">
                  <FiCheckCircle size={20} />
                  Xác nhận đơn hàng
                </h2>

                {/* Address Review */}
                <div className="review-block card">
                  <div className="review-block-header">
                    <h3>Địa chỉ giao hàng</h3>
                    <button className="btn btn-sm btn-outline" onClick={() => goToStep(1)}>
                      Thay đổi
                    </button>
                  </div>
                  {selectedAddress && (
                    <div className="review-address">
                      <p className="review-address-name">
                        {selectedAddress.fullName} - {selectedAddress.phone}
                      </p>
                      <p className="review-address-detail">
                        {selectedAddress.street}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Review */}
                <div className="review-block card">
                  <div className="review-block-header">
                    <h3>Phương thức thanh toán</h3>
                    <button className="btn btn-sm btn-outline" onClick={() => goToStep(2)}>
                      Thay đổi
                    </button>
                  </div>
                  <p className="review-payment">
                    {paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán qua VNPay'}
                  </p>
                </div>

                {/* Items Review */}
                <div className="review-block card">
                  <div className="review-block-header">
                    <h3>Sản phẩm ({cartItems.length})</h3>
                  </div>
                  <div className="review-items">
                    {cartItems.map((item) => {
                      const itemPrice = item.salePrice && Number(item.salePrice) < Number(item.price)
                        ? Number(item.salePrice)
                        : Number(item.price);
                      const imageUrl = item.image || item.productImage || 'https://placehold.co/60x75/f8f9fa/9ca3af?text=No+Image';

                      return (
                        <div className="review-item" key={item.id}>
                          <img src={imageUrl} alt={item.productName || item.name} className="review-item-image" />
                          <div className="review-item-info">
                            <span className="review-item-name">{item.productName || item.name}</span>
                            <span className="review-item-variant">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && ' | '}
                              {item.color && `Màu: ${item.color}`}
                            </span>
                          </div>
                          <div className="review-item-qty">x{item.quantity}</div>
                          <div className="review-item-price">{formatPrice(itemPrice * item.quantity)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="step-navigation">
                  <button className="btn btn-outline btn-lg" onClick={() => goToStep(2)}>
                    Quay lại
                  </button>
                  <button
                    className="btn btn-accent btn-lg"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading
                      ? 'Đang xử lý...'
                      : paymentMethod === 'VNPAY'
                        ? 'Thanh toán qua VNPay'
                        : 'Đặt hàng'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-sidebar">
            <div className="checkout-summary card">
              <h3 className="checkout-summary-title">Đơn hàng của bạn</h3>

              <div className="checkout-summary-items">
                {cartItems.map((item) => {
                  const itemPrice = item.salePrice && Number(item.salePrice) < Number(item.price)
                    ? Number(item.salePrice)
                    : Number(item.price);

                  return (
                    <div className="checkout-summary-item" key={item.id}>
                      <span className="summary-item-name">
                        {item.productName || item.name}
                        <span className="summary-item-qty"> x{item.quantity}</span>
                      </span>
                      <span className="summary-item-price">{formatPrice(itemPrice * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="summary-lines">
                <div className="summary-line">
                  <span>Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="summary-line">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="summary-line summary-discount">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(voucherDiscount)}</span>
                  </div>
                )}
                <div className="summary-line summary-total">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
