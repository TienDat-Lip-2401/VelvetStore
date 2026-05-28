import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiPercent } from 'react-icons/fi';
import { productAPI } from '../api';
import ProductCard from '../components/product/ProductCard';
import './SalePage.css';

const SalePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaleProducts = async () => {
      try {
        const res = await productAPI.getSale();
        setProducts(res.data?.data || res.data || res.products || []);
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm khuyến mãi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSaleProducts();
  }, []);

  return (
    <div className="sale-page">
      <div className="sale-breadcrumb">
        <div className="container">
          <Link to="/">Trang chủ</Link>
          <FiChevronRight size={14} />
          <span>Sản phẩm khuyến mãi</span>
        </div>
      </div>

      {/* Sale Banner */}
      <div className="sale-banner">
        <div className="container">
          <div className="sale-banner-content">
            <FiPercent size={36} />
            <div>
              <h1 className="sale-banner-title">Sản Phẩm Khuyến Mãi</h1>
              <p className="sale-banner-subtitle">
                Nhanh tay chọn mua những sản phẩm với mức giá ưu đãi hấp dẫn
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div className="sale-loading">
            <div className="spinner" />
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <p className="sale-count">
              Hiện có <strong>{products.length}</strong> sản phẩm đang khuyến mãi
            </p>
            <div className="sale-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="sale-empty">
            <h3>Hiện chưa có sản phẩm khuyến mãi</h3>
            <p>Hãy quay lại sau để khám phá các ưu đãi hấp dẫn.</p>
            <Link to="/san-pham" className="btn btn-primary">
              Xem tất cả sản phẩm
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalePage;
