import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { wishlistAPI } from '../../api';
import { formatPrice } from '../../utils/formatPrice';
import { toast } from 'react-toastify';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.url || 'https://placehold.co/400x500/f8f9fa/9ca3af?text=No+Image';
  const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100)
    : 0;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Vui lòng đăng nhập để thêm vào yêu thích');
      navigate('/dang-nhap');
      return;
    }
    try {
      await wishlistAPI.add({ productId: product.id });
      toast.success('Đã thêm vào danh sách yêu thích!');
    } catch (err) {
      if (err.message?.includes('đã tồn tại') || err.message?.includes('already')) {
        toast.info('Sản phẩm đã có trong yêu thích');
      } else {
        toast.error(err.message || 'Không thể thêm vào yêu thích');
      }
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/san-pham/${product.slug || product.id}`);
  };

  return (
    <div className="product-card">
      <Link to={`/san-pham/${product.slug || product.id}`} className="product-card-image">
        <img src={imageUrl} alt={product.name} loading="lazy" />
        {hasDiscount && (
          <span className="product-discount-badge">-{discountPercent}%</span>
        )}
        <div className="product-card-overlay">
          <button className="overlay-btn" title="Yêu thích" onClick={handleWishlist}>
            <FiHeart size={18} />
          </button>
          <button className="overlay-btn" title="Xem chi tiết" onClick={handleQuickView}>
            <FiShoppingBag size={18} />
          </button>
        </div>
      </Link>
      <div className="product-card-info">
        {product.category && (
          <span className="product-card-category">{product.category.name}</span>
        )}
        <Link to={`/san-pham/${product.slug || product.id}`}>
          <h3 className="product-card-name">{product.name}</h3>
        </Link>
        <div className="product-card-price">
          {hasDiscount ? (
            <>
              <span className="price-sale">{formatPrice(product.salePrice)}</span>
              <span className="price-original">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="price-current">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
