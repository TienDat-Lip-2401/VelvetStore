import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiPackage, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { paymentAPI } from '../api';
import './VnpayReturnPage.css';

const VnpayReturnPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { fetchCart } = useCart();

  const txnRef = searchParams.get('vnp_TxnRef');
  const amount = searchParams.get('vnp_Amount');
  const orderInfo = searchParams.get('vnp_OrderInfo');
  const transactionNo = searchParams.get('vnp_TransactionNo');

  // Kết quả phải lấy từ backend (đã xác minh chữ ký + số tiền), không tin query string
  const [verifying, setVerifying] = useState(true);
  const [responseCode, setResponseCode] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    paymentAPI.verifyVnpayReturn(location.search)
      .then((res) => setResponseCode(res.code))
      .catch((err) => {
        setResponseCode(err?.code || '99');
        setVerifyError(err?.message || '');
      })
      .finally(() => {
        setVerifying(false);
        // Giỏ hàng đã được backend xóa khi tạo đơn -> đồng bộ lại số lượng trên header
        fetchCart().catch(() => {});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSuccess = responseCode === '00';

  const getErrorMessage = (code) => {
    const errors = {
      '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ gian lận.',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking.',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
      '11': 'Đã hết hạn chờ thanh toán.',
      '12': 'Thẻ/Tài khoản bị khóa.',
      '13': 'Mã OTP không chính xác.',
      '24': 'Giao dịch đã bị hủy.',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Có lỗi xảy ra trong quá trình xử lý.',
    };
    return errors[code] || 'Đã xảy ra lỗi không xác định trong quá trình thanh toán.';
  };

  const formattedAmount = amount
    ? new Intl.NumberFormat('vi-VN').format(Number(amount) / 100) + '₫'
    : null;

  return (
    <div className="vnpay-return-page">
      <div className="container">
        <div className="vnpay-return-card card">
          {verifying ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <p className="vnpay-message">Đang xác minh kết quả thanh toán...</p>
            </div>
          ) : isSuccess ? (
            <>
              <div className="vnpay-icon vnpay-icon-success">
                <FiCheckCircle size={56} />
              </div>
              <h1 className="vnpay-heading">Thanh toán thành công!</h1>
              <p className="vnpay-message">
                Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận và đang được xử lý.
              </p>

              <div className="vnpay-details">
                {txnRef && (
                  <div className="vnpay-detail-row">
                    <span className="vnpay-detail-label">Mã đơn hàng</span>
                    <span className="vnpay-detail-value vnpay-order-code">{txnRef}</span>
                  </div>
                )}
                {transactionNo && (
                  <div className="vnpay-detail-row">
                    <span className="vnpay-detail-label">Mã giao dịch</span>
                    <span className="vnpay-detail-value">{transactionNo}</span>
                  </div>
                )}
                {formattedAmount && (
                  <div className="vnpay-detail-row">
                    <span className="vnpay-detail-label">Số tiền</span>
                    <span className="vnpay-detail-value vnpay-amount">{formattedAmount}</span>
                  </div>
                )}
                {orderInfo && (
                  <div className="vnpay-detail-row">
                    <span className="vnpay-detail-label">Nội dung</span>
                    <span className="vnpay-detail-value">{decodeURIComponent(orderInfo)}</span>
                  </div>
                )}
              </div>

              <div className="vnpay-actions">
                <Link to="/don-hang" className="btn btn-primary btn-lg">
                  <FiPackage size={18} />
                  Xem đơn hàng
                </Link>
                <Link to="/" className="btn btn-outline btn-lg">
                  Tiếp tục mua sắm
                  <FiArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="vnpay-icon vnpay-icon-failure">
                <FiXCircle size={56} />
              </div>
              <h1 className="vnpay-heading">Thanh toán thất bại</h1>
              <p className="vnpay-message">
                {verifyError || getErrorMessage(responseCode)}
              </p>

              {txnRef && (
                <div className="vnpay-details">
                  <div className="vnpay-detail-row">
                    <span className="vnpay-detail-label">Mã đơn hàng</span>
                    <span className="vnpay-detail-value">{txnRef}</span>
                  </div>
                  <div className="vnpay-detail-row">
                    <span className="vnpay-detail-label">Mã lỗi</span>
                    <span className="vnpay-detail-value">{responseCode}</span>
                  </div>
                </div>
              )}

              <div className="vnpay-actions">
                <Link to="/gio-hang" className="btn btn-accent btn-lg">
                  Quay lại giỏ hàng
                </Link>
                <Link to="/don-hang" className="btn btn-outline btn-lg">
                  <FiPackage size={18} />
                  Lịch sử đơn hàng
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VnpayReturnPage;
