import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiRefreshCw, FiTruck, FiShield } from 'react-icons/fi';
import './PolicyPage.css';

const TABS = [
  { id: 'return', label: 'Chính sách đổi trả', icon: <FiRefreshCw size={18} /> },
  { id: 'shipping', label: 'Chính sách vận chuyển', icon: <FiTruck size={18} /> },
  { id: 'warranty', label: 'Chính sách bảo hành', icon: <FiShield size={18} /> },
];

const PolicyPage = () => {
  const [activeTab, setActiveTab] = useState('return');

  return (
    <div className="policy-page">
      <div className="policy-breadcrumb">
        <div className="container">
          <Link to="/">Trang chủ</Link>
          <FiChevronRight size={14} />
          <span>Chính sách cửa hàng</span>
        </div>
      </div>

      <div className="container">
        <div className="policy-header">
          <h1 className="policy-page-title">Chính Sách Cửa Hàng</h1>
          <p className="policy-page-subtitle">
            Cam kết mang đến trải nghiệm mua sắm tốt nhất cho khách hàng
          </p>
        </div>

        <div className="policy-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`policy-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="policy-content">
          {activeTab === 'return' && (
            <div className="policy-section">
              <h2>Chính Sách Đổi Trả Hàng</h2>

              <h3>1. Điều kiện đổi trả</h3>
              <p>
                VelvetStore chấp nhận đổi trả sản phẩm trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng
                với các điều kiện sau:
              </p>
              <ul>
                <li>Sản phẩm còn nguyên tem, nhãn mác và chưa qua sử dụng</li>
                <li>Sản phẩm không bị hư hỏng, bẩn hoặc có mùi lạ do khách hàng gây ra</li>
                <li>Có hóa đơn mua hàng hoặc mã đơn hàng</li>
                <li>Sản phẩm thuộc diện được đổi trả (không áp dụng cho đồ lót, phụ kiện cá nhân)</li>
              </ul>

              <h3>2. Các trường hợp được đổi trả miễn phí</h3>
              <ul>
                <li>Sản phẩm giao sai mẫu, sai màu, sai kích cỡ so với đơn hàng</li>
                <li>Sản phẩm bị lỗi từ nhà sản xuất: rách, ố màu, đường may lỗi</li>
                <li>Sản phẩm bị hư hỏng trong quá trình vận chuyển</li>
              </ul>

              <h3>3. Quy trình đổi trả</h3>
              <ol>
                <li>Liên hệ bộ phận chăm sóc khách hàng qua hotline hoặc email</li>
                <li>Cung cấp mã đơn hàng, hình ảnh sản phẩm và lý do đổi trả</li>
                <li>Nhận xác nhận đổi trả từ VelvetStore trong vòng 24 giờ</li>
                <li>Gửi trả sản phẩm theo hướng dẫn</li>
                <li>Nhận sản phẩm thay thế hoặc hoàn tiền trong vòng 3-5 ngày làm việc</li>
              </ol>

              <h3>4. Phương thức hoàn tiền</h3>
              <p>
                Đối với các đơn hàng được chấp thuận hoàn tiền, chúng tôi sẽ hoàn lại theo phương thức thanh toán
                ban đầu. Thời gian hoàn tiền từ 5-7 ngày làm việc tùy theo ngân hàng.
              </p>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="policy-section">
              <h2>Chính Sách Vận Chuyển</h2>

              <h3>1. Phạm vi giao hàng</h3>
              <p>
                VelvetStore giao hàng trên toàn quốc thông qua các đơn vị vận chuyển uy tín như
                Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, J&T Express và Viettel Post.
              </p>

              <h3>2. Thời gian giao hàng</h3>
              <ul>
                <li><strong>Nội thành TP. Hồ Chí Minh và Hà Nội:</strong> 1-2 ngày làm việc</li>
                <li><strong>Các tỉnh thành lân cận:</strong> 2-3 ngày làm việc</li>
                <li><strong>Các tỉnh thành khác:</strong> 3-5 ngày làm việc</li>
                <li><strong>Khu vực vùng sâu, vùng xa:</strong> 5-7 ngày làm việc</li>
              </ul>

              <h3>3. Phí vận chuyển</h3>
              <ul>
                <li><strong>Miễn phí vận chuyển</strong> cho đơn hàng từ 500.000đ trở lên</li>
                <li>Đơn hàng dưới 500.000đ: phí vận chuyển từ 20.000đ - 40.000đ tùy khu vực</li>
                <li>Giao hàng nhanh (express): phụ thu thêm 15.000đ - 25.000đ</li>
              </ul>

              <h3>4. Kiểm tra hàng khi nhận</h3>
              <p>
                Quý khách được quyền kiểm tra sản phẩm trước khi thanh toán (đối với đơn COD).
                Nếu phát hiện sản phẩm bị hư hỏng hoặc sai, vui lòng từ chối nhận hàng và liên hệ
                ngay với chúng tôi.
              </p>

              <h3>5. Theo dõi đơn hàng</h3>
              <p>
                Sau khi đơn hàng được giao cho đơn vị vận chuyển, quý khách sẽ nhận được mã
                vận đơn qua email hoặc SMS để theo dõi tình trạng giao hàng.
              </p>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="policy-section">
              <h2>Chính Sách Bảo Hành</h2>

              <h3>1. Phạm vi bảo hành</h3>
              <p>
                VelvetStore bảo hành các sản phẩm bị lỗi kỹ thuật do quá trình sản xuất trong thời gian
                quy định cho từng loại sản phẩm.
              </p>

              <h3>2. Thời gian bảo hành</h3>
              <ul>
                <li><strong>Áo, quần, váy:</strong> 30 ngày bảo hành đường may, khóa kéo</li>
                <li><strong>Giày dép:</strong> 60 ngày bảo hành đế, keo dán, khóa</li>
                <li><strong>Túi xách, phụ kiện:</strong> 90 ngày bảo hành khóa, quai, đường chỉ</li>
              </ul>

              <h3>3. Các trường hợp được bảo hành</h3>
              <ul>
                <li>Đường may bị bung, đứt chỉ do lỗi sản xuất</li>
                <li>Khóa kéo bị hỏng, kẹt do lỗi kỹ thuật</li>
                <li>Nút, cúc bị rơi, bong tróc do chất lượng kém</li>
                <li>Vải bị phai màu bất thường sau khi giặt đúng hướng dẫn</li>
              </ul>

              <h3>4. Các trường hợp không được bảo hành</h3>
              <ul>
                <li>Sản phẩm hư hỏng do sử dụng sai cách hoặc tai nạn</li>
                <li>Sản phẩm đã được sửa chữa bởi bên thứ ba</li>
                <li>Hao mòn tự nhiên do sử dụng lâu dài</li>
                <li>Sản phẩm không có hóa đơn hoặc đã hết thời hạn bảo hành</li>
              </ul>

              <h3>5. Quy trình bảo hành</h3>
              <ol>
                <li>Liên hệ bộ phận chăm sóc khách hàng với mã đơn hàng và hình ảnh lỗi</li>
                <li>Gửi sản phẩm về cửa hàng để kiểm tra (phí gửi do VelvetStore chi trả)</li>
                <li>Thời gian xử lý bảo hành từ 5-10 ngày làm việc</li>
                <li>Nhận lại sản phẩm đã sửa chữa hoặc sản phẩm thay thế</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
