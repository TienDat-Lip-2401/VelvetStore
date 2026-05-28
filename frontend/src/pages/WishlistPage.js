import { useState, useEffect } from 'react';
import { wishlistAPI } from '../api';
import { toast } from 'react-toastify';
import ProductCard from '../components/product/ProductCard';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './WishlistPage.css';

const WishlistPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await wishlistAPI.getAll();
      setItems(res.wishlists || res.items || res);
    } catch {
      toast.error('Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistAPI.remove(productId);
      setItems((prev) => prev.filter((item) => {
        const id = item.product?.id || item.productId;
        return id !== productId;
      }));
      toast.success('Đã xóa khỏi danh sách yêu thích');
    } catch {
      toast.error('Không thể xóa sản phẩm');
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="loading-text">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <h1 className="page-title">Sản phẩm yêu thích</h1>

        {items.length === 0 ? (
          <div className="wishlist-empty">
            <FiHeart size={48} />
            <h3>Danh sách yêu thích trống</h3>
            <p>Bạn chưa thêm sản phẩm nào vào danh sách yêu thích.</p>
            <Link to="/san-pham" className="btn btn-primary">
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <>
            <p className="wishlist-count">{items.length} sản phẩm</p>
            <div className="wishlist-grid">
              {items.map((item) => {
                const product = item.product || item;
                return (
                  <div key={item.id || product.id} className="wishlist-item">
                    <ProductCard product={product} />
                    <button
                      className="wishlist-remove-btn"
                      onClick={() => handleRemove(product.id)}
                      title="Xóa khỏi yêu thích"
                    >
                      <FiTrash2 size={14} />
                      <span>Xóa</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
