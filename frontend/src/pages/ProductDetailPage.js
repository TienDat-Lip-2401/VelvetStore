import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { productAPI, reviewAPI, wishlistAPI } from '../api';
import ProductCard from '../components/product/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import { FiMinus, FiPlus, FiShoppingBag, FiHeart, FiStar, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [addingWishlist, setAddingWishlist] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const [relatedProducts, setRelatedProducts] = useState([]);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productAPI.getById(slug);
        const productData = res.product || res;
        setProduct(productData);

        setSelectedImage(0);
        setSelectedSize(null);
        setSelectedColor(null);
        setQuantity(1);

        if (productData.categoryId) {
          try {
            const relRes = await productAPI.getAll({
              categoryId: productData.categoryId,
              limit: 4,
            });
            const related = (relRes.products || relRes.data || []).filter(
              (p) => p.id !== productData.id
            );
            setRelatedProducts(related.slice(0, 4));
          } catch {
            setRelatedProducts([]);
          }
        }
      } catch {
        toast.error('Không tìm thấy sản phẩm');
        navigate('/san-pham');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, navigate]);

  const fetchReviews = async (productId) => {
    setReviewsLoading(true);
    try {
      const res = await reviewAPI.getByProduct(productId);
      const reviewList = res.reviews || res.data || res || [];
      setReviews(reviewList);
      if (reviewList.length > 0) {
        const avg = reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length;
        setAverageRating(Math.round(avg * 10) / 10);
      } else {
        setAverageRating(0);
      }
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!product) return;
    fetchReviews(product.id);

    // Check if product is in wishlist
    if (user) {
      wishlistAPI.getAll().then((res) => {
        const items = res.wishlists || res.items || [];
        const inWishlist = items.some((item) => {
          const pid = item.product?.id || item.productId;
          return pid === product.id;
        });
        setWishlisted(inWishlist);
      }).catch(() => {});
    }
  }, [product, user]);

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để thêm vào yêu thích');
      navigate('/dang-nhap');
      return;
    }
    setAddingWishlist(true);
    try {
      if (wishlisted) {
        await wishlistAPI.remove(product.id);
        setWishlisted(false);
        toast.success('Đã xóa khỏi danh sách yêu thích');
      } else {
        await wishlistAPI.add({ productId: product.id });
        setWishlisted(true);
        toast.success('Đã thêm vào danh sách yêu thích!');
      }
    } catch (err) {
      if (err.message?.includes('đã tồn tại') || err.message?.includes('already')) {
        setWishlisted(true);
      } else {
        toast.error(err.message || 'Không thể cập nhật yêu thích');
      }
    } finally {
      setAddingWishlist(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewRating) {
      toast.warning('Vui lòng chọn số sao đánh giá');
      return;
    }
    if (!reviewComment.trim()) {
      toast.warning('Vui lòng nhập nội dung đánh giá');
      return;
    }
    try {
      setSubmittingReview(true);
      await reviewAPI.create({ productId: product.id, rating: reviewRating, comment: reviewComment.trim() });
      toast.success('Đánh giá thành công!');
      setReviewRating(0);
      setReviewComment('');
      fetchReviews(product.id);
    } catch (err) {
      toast.error(err.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="pdp-loading">
        <div className="pdp-spinner" />
        <p>Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images || [];
  const primaryImage = images.find((img) => img.isPrimary) || images[0];
  const sortedImages = primaryImage
    ? [primaryImage, ...images.filter((img) => img.id !== primaryImage.id)]
    : images;
  const currentImage = sortedImages[selectedImage]?.url || 'https://placehold.co/600x700/f8f9fa/9ca3af?text=No+Image';

  const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100)
    : 0;

  const variants = product.variants || [];
  const uniqueSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  // Lọc màu khả dụng theo size đã chọn
  const availableColors = selectedSize
    ? [...new Set(variants.filter((v) => v.size === selectedSize).map((v) => v.color).filter(Boolean))]
    : uniqueColors;

  // Lọc size khả dụng theo màu đã chọn
  const availableSizes = selectedColor
    ? [...new Set(variants.filter((v) => v.color === selectedColor).map((v) => v.size).filter(Boolean))]
    : uniqueSizes;

  const getSelectedVariant = () => {
    if (!selectedSize && !selectedColor) return null;
    return variants.find(
      (v) =>
        (!selectedSize || v.size === selectedSize) &&
        (!selectedColor || v.color === selectedColor)
    );
  };

  const selectedVariant = getSelectedVariant();
  const needsSize = uniqueSizes.length > 0 && !selectedSize;
  const needsColor = uniqueColors.length > 0 && !selectedColor;
  const variantSelected = !needsSize && !needsColor;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : variants.some((v) => v.stock > 0);

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty < 1) return;
    const maxStock = selectedVariant?.stock || 99;
    if (newQty > maxStock) return;
    setQuantity(newQty);
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/dang-nhap');
      return;
    }

    if (uniqueSizes.length > 0 && !selectedSize) {
      toast.warning('Vui lòng chọn kích thước');
      return;
    }

    if (uniqueColors.length > 0 && !selectedColor) {
      toast.warning('Vui lòng chọn màu sắc');
      return;
    }

    if (!selectedVariant) {
      toast.error('Phiên bản sản phẩm không tồn tại');
      return;
    }

    if (selectedVariant.stock < 1) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(selectedVariant.id, quantity);
      toast.success('Thêm vào giỏ hàng thành công!');
    } catch (err) {
      toast.error(err.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        size={16}
        className={i < Math.round(rating) ? 'pdp-star-filled' : 'pdp-star-empty'}
      />
    ));
  };

  return (
    <div className="product-detail-page">
      <div className="pdp-breadcrumb">
        <div className="pdp-container">
          <Link to="/">Trang chủ</Link>
          <FiChevronRight size={14} />
          <Link to="/san-pham">Sản phẩm</Link>
          <FiChevronRight size={14} />
          {product.category && (
            <>
              <Link to={`/san-pham?categoryId=${product.categoryId}`}>
                {product.category.name}
              </Link>
              <FiChevronRight size={14} />
            </>
          )}
          <span>{product.name}</span>
        </div>
      </div>

      <div className="pdp-container">
        <div className="pdp-product">
          <div className="pdp-gallery">
            <div className="pdp-main-image">
              <img src={currentImage} alt={product.name} />
              {hasDiscount && (
                <span className="pdp-discount-badge">-{discountPercent}%</span>
              )}
            </div>
            {sortedImages.length > 1 && (
              <div className="pdp-thumbnails">
                {sortedImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    className={`pdp-thumb ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img.url} alt={`${product.name} - Ảnh ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pdp-info">
            {product.category && (
              <Link to={`/san-pham?categoryId=${product.categoryId}`} className="pdp-category">
                {product.category.name}
              </Link>
            )}

            <h1 className="pdp-name">{product.name}</h1>

            {reviews.length > 0 && (
              <div className="pdp-rating-summary">
                <div className="pdp-stars">{renderStars(averageRating)}</div>
                <span className="pdp-rating-text">
                  {averageRating} ({reviews.length} đánh giá)
                </span>
              </div>
            )}

            <div className="pdp-price">
              {hasDiscount ? (
                <>
                  <span className="pdp-price-sale">{formatPrice(product.salePrice)}</span>
                  <span className="pdp-price-original">{formatPrice(product.price)}</span>
                  <span className="pdp-price-percent">-{discountPercent}%</span>
                </>
              ) : (
                <span className="pdp-price-current">{formatPrice(product.price)}</span>
              )}
            </div>

            {product.description && (
              <p className="pdp-description">{product.description}</p>
            )}

            <div className="pdp-meta">
              {product.brand && (
                <div className="pdp-meta-item">
                  <span className="pdp-meta-label">Thương hiệu:</span>
                  <span className="pdp-meta-value">{product.brand}</span>
                </div>
              )}
              {product.material && (
                <div className="pdp-meta-item">
                  <span className="pdp-meta-label">Chất liệu:</span>
                  <span className="pdp-meta-value">{product.material}</span>
                </div>
              )}
            </div>

            {uniqueSizes.length > 0 && (
              <div className="pdp-variant-group">
                <label className="pdp-variant-label">
                  Kích thước: {selectedSize && <strong>{selectedSize}</strong>}
                </label>
                <div className="pdp-variant-options">
                  {uniqueSizes.map((size) => {
                    const isAvailable = availableSizes.includes(size);
                    return (
                      <button
                        key={size}
                        className={`pdp-size-btn ${selectedSize === size ? 'active' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                        onClick={() => {
                          const newSize = size === selectedSize ? null : size;
                          setSelectedSize(newSize);
                          // Reset màu nếu combo không tồn tại
                          if (newSize && selectedColor) {
                            const comboExists = variants.some((v) => v.size === newSize && v.color === selectedColor);
                            if (!comboExists) setSelectedColor(null);
                          }
                          setQuantity(1);
                        }}
                        disabled={!isAvailable}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {uniqueColors.length > 0 && (
              <div className="pdp-variant-group">
                <label className="pdp-variant-label">
                  Màu sắc: {selectedColor && <strong>{selectedColor}</strong>}
                </label>
                <div className="pdp-variant-options">
                  {uniqueColors.map((color) => {
                    const isAvailable = availableColors.includes(color);
                    return (
                      <button
                        key={color}
                        className={`pdp-color-btn ${selectedColor === color ? 'active' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                        onClick={() => {
                          const newColor = color === selectedColor ? null : color;
                          setSelectedColor(newColor);
                          // Reset size nếu combo không tồn tại
                          if (newColor && selectedSize) {
                            const comboExists = variants.some((v) => v.size === selectedSize && v.color === newColor);
                            if (!comboExists) setSelectedSize(null);
                          }
                          setQuantity(1);
                        }}
                        disabled={!isAvailable}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedVariant && (
              <p className="pdp-stock">
                {selectedVariant.stock > 0 ? (
                  <span className="pdp-stock-available">Còn {selectedVariant.stock} sản phẩm</span>
                ) : (
                  <span className="pdp-stock-out">Hết hàng</span>
                )}
              </p>
            )}

            <div className="pdp-actions">
              <div className="pdp-quantity">
                <button
                  className="pdp-qty-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <FiMinus size={16} />
                </button>
                <span className="pdp-qty-value">{quantity}</span>
                <button
                  className="pdp-qty-btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={selectedVariant && quantity >= selectedVariant.stock}
                >
                  <FiPlus size={16} />
                </button>
              </div>

              <button
                className="pdp-add-to-cart"
                onClick={handleAddToCart}
                disabled={addingToCart || !inStock || !variantSelected}
              >
                <FiShoppingBag size={18} />
                {addingToCart
                  ? 'Đang thêm...'
                  : !variantSelected
                    ? 'Vui lòng chọn phân loại'
                    : 'Thêm vào giỏ hàng'}
              </button>

              <button
                className={`pdp-wishlist-btn ${wishlisted ? 'active' : ''}`}
                onClick={handleToggleWishlist}
                disabled={addingWishlist}
                title={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
              >
                <FiHeart size={20} />
              </button>
            </div>
          </div>
        </div>

        <section className="pdp-reviews">
          <h2 className="pdp-section-title">
            Đánh giá sản phẩm
            {reviews.length > 0 && <span className="pdp-review-count">({reviews.length})</span>}
          </h2>

          {/* Review Form */}
          {user ? (
            <form className="pdp-review-form" onSubmit={handleSubmitReview}>
              <div className="pdp-review-form-rating">
                <span className="pdp-review-form-label">Đánh giá của bạn:</span>
                <div className="pdp-review-form-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`pdp-review-star-btn ${star <= (reviewHover || reviewRating) ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                    >
                      <FiStar size={22} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="pdp-review-form-textarea"
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
              />
              <button type="submit" className="pdp-review-form-submit" disabled={submittingReview}>
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </form>
          ) : (
            <div className="pdp-review-login-prompt">
              <p>Vui lòng <a href="/dang-nhap">đăng nhập</a> để đánh giá sản phẩm.</p>
            </div>
          )}

          {reviewsLoading ? (
            <div className="pdp-reviews-loading">
              <div className="pdp-spinner" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="pdp-reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="pdp-review-item">
                  <div className="pdp-review-header">
                    <div className="pdp-review-user">
                      <div className="pdp-review-avatar">
                        {(review.user?.fullName || review.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="pdp-review-name">{review.user?.fullName || review.user?.name || 'Khách hàng'}</p>
                        <div className="pdp-review-stars">{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    <span className="pdp-review-date">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="pdp-review-comment">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="pdp-review-images">
                      {review.images.map((img, idx) => (
                        <img key={idx} src={img.url || img} alt={`Ảnh đánh giá ${idx + 1}`} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="pdp-no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>
          )}
        </section>

        {relatedProducts.length > 0 && (
          <section className="pdp-related">
            <h2 className="pdp-section-title">Sản phẩm liên quan</h2>
            <div className="pdp-related-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
