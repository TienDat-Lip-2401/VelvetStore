import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import { toast } from 'react-toastify';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Vui lòng nhập địa chỉ email');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Đã gửi email đặt lại mật khẩu!');
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể gửi email. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>Quên mật khẩu</h1>
          <p>Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        {sent ? (
          <div className="forgot-success">
            <div className="forgot-success-icon">
              <FiMail size={32} />
            </div>
            <h3>Kiểm tra email của bạn</h3>
            <p>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{' '}
              <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.
            </p>
            <button
              className="btn btn-outline btn-block"
              onClick={() => setSent(false)}
            >
              Gửi lại email
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="Nhập địa chỉ email đã đăng ký"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>
        )}

        <div className="auth-card-footer">
          <Link to="/dang-nhap" className="back-to-login">
            <FiArrowLeft size={16} />
            <span>Quay lại đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
