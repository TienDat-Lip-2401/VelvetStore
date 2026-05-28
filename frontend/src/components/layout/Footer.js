import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <span className="logo-text">VELVET</span>
              <span className="logo-accent">STORE</span>
            </div>
            <p className="footer-desc">
              Thời trang chất lượng cao với phong cách hiện đại, mang đến trải nghiệm mua sắm tuyệt vời cho bạn.
            </p>
          </div>

          <div className="footer-col">
            <h4>Danh mục</h4>
            <Link to="/san-pham?category=ao">Áo</Link>
            <Link to="/san-pham?category=quan">Quần</Link>
            <Link to="/san-pham?category=vay">Váy</Link>
            <Link to="/san-pham?category=phu-kien">Phụ kiện</Link>
          </div>

          <div className="footer-col">
            <h4>Hỗ trợ</h4>
            <Link to="/chinh-sach">Chính sách đổi trả</Link>
            <Link to="/chinh-sach">Chính sách vận chuyển</Link>
            <Link to="/chinh-sach">Hướng dẫn mua hàng</Link>
            <Link to="/lien-he">Liên hệ</Link>
          </div>

          <div className="footer-col">
            <h4>Liên hệ</h4>
            <div className="footer-contact">
              <FiMapPin size={16} />
              <span>123 Nguyễn Văn Linh, Quận 7, TP.HCM</span>
            </div>
            <div className="footer-contact">
              <FiPhone size={16} />
              <span>0901 234 567</span>
            </div>
            <div className="footer-contact">
              <FiMail size={16} />
              <span>contact@velvetstore.vn</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 VelvetStore. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
