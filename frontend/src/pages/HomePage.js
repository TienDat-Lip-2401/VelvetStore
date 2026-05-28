import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiRefreshCw, FiShield, FiHeadphones, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { productAPI, categoryAPI } from '../api';
import ProductCard from '../components/product/ProductCard';
import './HomePage.css';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80',
    tag: 'Bộ sưu tập mới',
    title: 'Định Nghĩa\nPhong Cách',
    subtitle: 'Khám phá xu hướng thời trang mùa mới với những thiết kế độc đáo, tinh tế và đậm chất cá nhân.',
    cta: 'Khám phá ngay',
    link: '/san-pham',
  },
  {
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80',
    tag: 'Xu hướng 2026',
    title: 'Tự Tin\nToả Sáng',
    subtitle: 'Tự tin thể hiện cá tính riêng với những trang phục được tuyển chọn kỹ lưỡng từ các thương hiệu hàng đầu.',
    cta: 'Mua sắm ngay',
    link: '/san-pham',
  },
  {
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80',
    tag: 'Ưu đãi đặc biệt',
    title: 'Sale Lên\nĐến 50%',
    subtitle: 'Giảm giá lên đến 50% cho các sản phẩm thời trang được yêu thích nhất. Số lượng có hạn.',
    cta: 'Xem ưu đãi',
    link: '/giam-gia',
  },
];

const CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
  'https://images.unsplash.com/photo-1434389677669-e08b4cda3a57?w=600&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80',
  'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80',
];

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroAnimating, setHeroAnimating] = useState(false);
  const heroTimerRef = useRef(null);
  const saleScrollRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, saleRes] = await Promise.all([
          categoryAPI.getAll(),
          productAPI.getSale(),
        ]);
        const cats = catRes.categories || catRes.data || [];
        setCategories(Array.isArray(cats) ? cats : []);
        setSaleProducts(saleRes.products || saleRes.data || []);

        // Fetch products for each category
        const catsArr = Array.isArray(cats) ? cats : [];
        const productsByCategory = {};
        const categoryFetches = catsArr.map(async (cat) => {
          try {
            const res = await productAPI.getByCategory(cat.id, { limit: 8 });
            const products = res.products || res.data || [];
            if (Array.isArray(products) && products.length > 0) {
              productsByCategory[cat.id] = products;
            }
          } catch {}
        });
        await Promise.all(categoryFetches);
        setCategoryProducts(productsByCategory);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu trang chủ:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Hero auto-advance
  useEffect(() => {
    heroTimerRef.current = setInterval(() => {
      goToSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(heroTimerRef.current);
  }, []);

  const goToSlide = (indexOrFn) => {
    if (heroAnimating) return;
    setHeroAnimating(true);
    setHeroIndex(indexOrFn);
    clearInterval(heroTimerRef.current);
    heroTimerRef.current = setInterval(() => {
      goToSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    setTimeout(() => setHeroAnimating(false), 800);
  };

  const heroNext = () => goToSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const heroPrev = () => goToSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  const scrollSale = (dir) => {
    if (!saleScrollRef.current) return;
    const scrollAmount = saleScrollRef.current.offsetWidth * 0.75;
    saleScrollRef.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };

  const currentSlide = HERO_SLIDES[heroIndex];

  return (
    <div className="hp">
      {/* ─── HERO ─── */}
      <section className="hp-hero">
        <div className="hp-hero__bg-wrap">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`hp-hero__bg ${i === heroIndex ? 'hp-hero__bg--active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
          <div className="hp-hero__vignette" />
        </div>

        <div className="hp-hero__content container">
          <div className="hp-hero__text" key={heroIndex}>
            <span className="hp-hero__tag">{currentSlide.tag}</span>
            <h1 className="hp-hero__title">
              {currentSlide.title.split('\n').map((line, i) => (
                <span key={i} className="hp-hero__title-line" style={{ animationDelay: `${i * 0.12}s` }}>
                  {line}
                </span>
              ))}
            </h1>
            <p className="hp-hero__subtitle">{currentSlide.subtitle}</p>
            <Link to={currentSlide.link} className="hp-hero__cta">
              {currentSlide.cta}
              <FiArrowRight size={18} />
            </Link>
          </div>

          <div className="hp-hero__controls">
            <div className="hp-hero__dots">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`hp-hero__dot ${i === heroIndex ? 'hp-hero__dot--active' : ''}`}
                  onClick={() => goToSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <div className="hp-hero__arrows">
              <button className="hp-hero__arrow" onClick={heroPrev} aria-label="Previous">
                <FiChevronLeft size={20} />
              </button>
              <button className="hp-hero__arrow" onClick={heroNext} aria-label="Next">
                <FiChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="hp-hero__counter">
          <span className="hp-hero__counter-current">{String(heroIndex + 1).padStart(2, '0')}</span>
          <span className="hp-hero__counter-sep">/</span>
          <span className="hp-hero__counter-total">{String(HERO_SLIDES.length).padStart(2, '0')}</span>
        </div>
      </section>

      {/* ─── BRAND PROMISES ─── */}
      <section className="hp-promises">
        <div className="container">
          <div className="hp-promises__grid">
            {[
              { icon: <FiTruck size={22} />, title: 'Miễn phí vận chuyển', desc: 'Cho đơn hàng từ 500.000đ' },
              { icon: <FiRefreshCw size={22} />, title: 'Đổi trả 30 ngày', desc: 'Đổi trả miễn phí, dễ dàng' },
              { icon: <FiShield size={22} />, title: 'Thanh toán an toàn', desc: 'Bảo mật thông tin tuyệt đối' },
              { icon: <FiHeadphones size={22} />, title: 'Hỗ trợ 24/7', desc: 'Luôn sẵn sàng phục vụ bạn' },
            ].map((item, i) => (
              <div key={i} className="hp-promises__item">
                <div className="hp-promises__icon">{item.icon}</div>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      {categories.length > 0 && (
        <section className="hp-categories">
          <div className="container">
            <div className="hp-section-head">
              <span className="hp-section-head__tag">Danh mục</span>
              <h2 className="hp-section-head__title">Khám Phá Theo Phong Cách</h2>
              <p className="hp-section-head__sub">Tìm kiếm sản phẩm phù hợp với phong cách riêng của bạn</p>
            </div>
            <div className="hp-categories__grid">
              {categories.slice(0, 6).map((cat, i) => (
                <Link
                  to={`/san-pham?categoryId=${cat.id}`}
                  key={cat.id}
                  className="hp-cat-card"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="hp-cat-card__img">
                    <img
                      src={cat.image || CATEGORY_IMAGES[i % CATEGORY_IMAGES.length]}
                      alt={cat.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="hp-cat-card__info">
                    <h3>{cat.name}</h3>
                    <span className="hp-cat-card__link">
                      Xem thêm <FiArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── PRODUCTS BY CATEGORY ─── */}
      {loading ? (
        <section className="hp-featured">
          <div className="container">
            <div className="loading-spinner"><div className="spinner" /></div>
          </div>
        </section>
      ) : (
        categories.filter((cat) => categoryProducts[cat.id]?.length > 0).map((cat, idx) => (
          <section key={cat.id} className={`hp-cat-products ${idx % 2 === 0 ? 'hp-cat-products--alt' : ''}`}>
            <div className="container">
              <div className="hp-cat-products__head">
                <div>
                  <span className="hp-section-head__tag">{cat.name}</span>
                  <h2 className="hp-section-head__title">{cat.name}</h2>
                  {cat.description && <p className="hp-section-head__sub">{cat.description}</p>}
                </div>
                <Link to={`/san-pham?categoryId=${cat.id}`} className="hp-view-all">
                  Xem tất cả
                  <FiArrowRight size={16} />
                </Link>
              </div>
              <div className="product-grid">
                {categoryProducts[cat.id].slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        ))
      )}

      {/* ─── EDITORIAL BANNER ─── */}
      <section className="hp-editorial">
        <div className="container">
          <div className="hp-editorial__grid">
            <div className="hp-editorial__card hp-editorial__card--large">
              <img
                src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=900&q=80"
                alt="New Arrivals"
                loading="lazy"
              />
              <div className="hp-editorial__overlay">
                <span className="hp-editorial__label">Hàng mới về</span>
                <h3 className="hp-editorial__heading">Xu Hướng Mùa Mới</h3>
                <Link to="/san-pham" className="hp-editorial__link">
                  Khám phá <FiArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="hp-editorial__card">
              <img
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80"
                alt="Accessories"
                loading="lazy"
              />
              <div className="hp-editorial__overlay">
                <span className="hp-editorial__label">Phụ kiện</span>
                <h3 className="hp-editorial__heading">Điểm Nhấn Tinh Tế</h3>
                <Link to="/san-pham" className="hp-editorial__link">
                  Xem thêm <FiArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="hp-editorial__card">
              <img
                src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&q=80"
                alt="Best Sellers"
                loading="lazy"
              />
              <div className="hp-editorial__overlay">
                <span className="hp-editorial__label">Bán chạy</span>
                <h3 className="hp-editorial__heading">Best Sellers</h3>
                <Link to="/san-pham" className="hp-editorial__link">
                  Xem thêm <FiArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SALE PRODUCTS ─── */}
      {saleProducts.length > 0 && (
        <section className="hp-sale">
          <div className="container">
            <div className="hp-sale__head">
              <div>
                <span className="hp-section-head__tag hp-section-head__tag--accent">Giảm giá</span>
                <h2 className="hp-section-head__title">Ưu Đãi Hấp Dẫn</h2>
                <p className="hp-section-head__sub">Nhanh tay chọn mua với mức giá cực tốt. Số lượng có hạn!</p>
              </div>
              <div className="hp-sale__arrows">
                <button className="hp-sale__arrow" onClick={() => scrollSale(-1)} aria-label="Previous">
                  <FiChevronLeft size={20} />
                </button>
                <button className="hp-sale__arrow" onClick={() => scrollSale(1)} aria-label="Next">
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="hp-sale__track" ref={saleScrollRef}>
              {saleProducts.map((product) => (
                <div key={product.id} className="hp-sale__item">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="hp-section-foot">
              <Link to="/giam-gia" className="hp-view-all hp-view-all--accent">
                Xem tất cả ưu đãi
                <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── NEWSLETTER ─── */}
      <section className="hp-newsletter">
        <div className="container">
          <div className="hp-newsletter__inner">
            <div className="hp-newsletter__text">
              <h2>Đăng Ký Nhận Tin</h2>
              <p>Nhận thông báo về bộ sưu tập mới và ưu đãi độc quyền</p>
            </div>
            <form className="hp-newsletter__form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Nhập email của bạn" />
              <button type="submit">
                Đăng ký
                <FiArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
