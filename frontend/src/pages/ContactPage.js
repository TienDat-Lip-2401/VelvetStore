import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiMapPin, FiPhone, FiMail, FiClock, FiSend } from 'react-icons/fi';
import { contactAPI } from '../api';
import { toast } from 'react-toastify';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSubmitting(true);
    try {
      await contactAPI.create(formData);
      toast.success('Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Gửi liên hệ thất bại. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-breadcrumb">
        <div className="container">
          <Link to="/">Trang chủ</Link>
          <FiChevronRight size={14} />
          <span>Liên hệ</span>
        </div>
      </div>

      <div className="container">
        <div className="contact-header">
          <h1 className="contact-page-title">Liên Hệ Với Chúng Tôi</h1>
          <p className="contact-page-subtitle">
            Bạn có câu hỏi hay cần hỗ trợ? Hãy để lại thông tin, chúng tôi sẽ liên hệ lại sớm nhất.
          </p>
        </div>

        <div className="contact-layout">
          {/* Contact Form */}
          <div className="contact-form-wrapper">
            <h2 className="contact-section-title">Gửi Tin Nhắn</h2>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form-row">
                <div className="contact-form-group">
                  <label htmlFor="name">Họ và tên <span className="required">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="email">Email <span className="required">*</span></label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ email"
                    required
                  />
                </div>
              </div>

              <div className="contact-form-row">
                <div className="contact-form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="subject">Chủ đề</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Nhập chủ đề"
                  />
                </div>
              </div>

              <div className="contact-form-group">
                <label htmlFor="message">Nội dung <span className="required">*</span></label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Nhập nội dung tin nhắn..."
                  rows={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary contact-submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Đang gửi...' : (
                  <>
                    <FiSend size={16} />
                    Gửi Tin Nhắn
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Store Info Sidebar */}
          <aside className="contact-sidebar">
            <h2 className="contact-section-title">Thông Tin Cửa Hàng</h2>

            <div className="contact-info-list">
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <FiMapPin size={20} />
                </div>
                <div>
                  <h4>Địa chỉ</h4>
                  <p>123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <FiPhone size={20} />
                </div>
                <div>
                  <h4>Điện thoại</h4>
                  <p>0123 456 789</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <FiMail size={20} />
                </div>
                <div>
                  <h4>Email</h4>
                  <p>contact@velvetstore.vn</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <FiClock size={20} />
                </div>
                <div>
                  <h4>Giờ làm việc</h4>
                  <p>Thứ 2 - Thứ 7: 8:00 - 21:00</p>
                  <p>Chủ nhật: 9:00 - 18:00</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
