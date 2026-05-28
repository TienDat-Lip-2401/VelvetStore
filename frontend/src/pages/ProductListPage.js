import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../api';
import ProductCard from '../components/product/ProductCard';
import { FiChevronRight, FiFilter, FiX } from 'react-icons/fi';
import ReactPaginate from 'react-paginate';
import './ProductListPage.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'best_selling', label: 'Bán chạy' },
];

const COLOR_OPTIONS = [
  { value: 'den', label: 'Đen', hex: '#1a1a1a' },
  { value: 'trang', label: 'Trắng', hex: '#ffffff' },
  { value: 'do', label: 'Đỏ', hex: '#e53e3e' },
  { value: 'xanh-duong', label: 'Xanh dương', hex: '#3182ce' },
  { value: 'xanh-la', label: 'Xanh lá', hex: '#38a169' },
  { value: 'vang', label: 'Vàng', hex: '#d69e2e' },
  { value: 'hong', label: 'Hồng', hex: '#ed64a6' },
  { value: 'nau', label: 'Nâu', hex: '#8b6f47' },
  { value: 'xam', label: 'Xám', hex: '#a0aec0' },
  { value: 'be', label: 'Be', hex: '#d4c5a9' },
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ITEMS_PER_PAGE = 12;

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  const selectedCategoryId = searchParams.get('categoryId') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const selectedColor = searchParams.get('color') || '';
  const selectedSize = searchParams.get('size') || '';

  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryAPI.getAll();
        setCategories(res.categories || res || []);
      } catch {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sort: sortBy,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (selectedColor) params.color = selectedColor;
      if (selectedSize) params.size = selectedSize;

      const res = await productAPI.getAll(params);
      setProducts(res.products || res.data || []);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / ITEMS_PER_PAGE));
      setTotalProducts(res.total || res.totalProducts || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedCategoryId, sortBy, minPrice, maxPrice, selectedColor, selectedSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handlePageChange = ({ selected }) => {
    updateFilter('page', String(selected + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (e) => {
    updateFilter('sort', e.target.value);
  };

  const handleCategorySelect = (catId) => {
    updateFilter('categoryId', catId === selectedCategoryId ? '' : catId);
  };

  const handleColorSelect = (color) => {
    updateFilter('color', color === selectedColor ? '' : color);
  };

  const handleSizeSelect = (size) => {
    updateFilter('size', size === selectedSize ? '' : size);
  };

  const handlePriceApply = () => {
    const newParams = new URLSearchParams(searchParams);
    if (localMinPrice) {
      newParams.set('minPrice', localMinPrice);
    } else {
      newParams.delete('minPrice');
    }
    if (localMaxPrice) {
      newParams.set('maxPrice', localMaxPrice);
    } else {
      newParams.delete('maxPrice');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setLocalMinPrice('');
    setLocalMaxPrice('');
  };

  const hasActiveFilters = selectedCategoryId || minPrice || maxPrice || selectedColor || selectedSize || searchQuery;

  const selectedCategory = categories.find(c => String(c.id) === String(selectedCategoryId));

  return (
    <div className="product-list-page">
      <div className="plp-breadcrumb">
        <div className="plp-container">
          <Link to="/">Trang chủ</Link>
          <FiChevronRight size={14} />
          {selectedCategory ? (
            <>
              <Link to="/san-pham">Sản phẩm</Link>
              <FiChevronRight size={14} />
              <span>{selectedCategory.name}</span>
            </>
          ) : (
            <span>{searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : 'Tất cả sản phẩm'}</span>
          )}
        </div>
      </div>

      <div className="plp-container">
        <div className="plp-layout">
          <button className="plp-mobile-filter-btn" onClick={() => setMobileFilterOpen(true)}>
            <FiFilter size={18} />
            Bộ lọc
          </button>

          <aside className={`plp-sidebar ${mobileFilterOpen ? 'plp-sidebar--open' : ''}`}>
            <div className="plp-sidebar-header">
              <h3>Bộ lọc</h3>
              <button className="plp-sidebar-close" onClick={() => setMobileFilterOpen(false)}>
                <FiX size={20} />
              </button>
            </div>

            {hasActiveFilters && (
              <button className="plp-clear-filters" onClick={handleClearFilters}>
                Xóa tất cả bộ lọc
              </button>
            )}

            <div className="plp-filter-group">
              <h4 className="plp-filter-title">DANH MỤC</h4>
              <ul className="plp-category-list">
                {categories.map(cat => (
                  <li key={cat.id}>
                    <button
                      className={`plp-category-item ${String(cat.id) === String(selectedCategoryId) ? 'active' : ''}`}
                      onClick={() => handleCategorySelect(String(cat.id))}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="plp-filter-group">
              <h4 className="plp-filter-title">KHOẢNG GIÁ</h4>
              <div className="plp-price-inputs">
                <input
                  type="number"
                  placeholder="Từ"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  min="0"
                />
                <span className="plp-price-separator">—</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  min="0"
                />
              </div>
              <button className="plp-price-apply" onClick={handlePriceApply}>
                Áp dụng
              </button>
            </div>

            <div className="plp-filter-group">
              <h4 className="plp-filter-title">MÀU SẮC</h4>
              <div className="plp-color-list">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color.value}
                    className={`plp-color-swatch ${selectedColor === color.value ? 'active' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                    onClick={() => handleColorSelect(color.value)}
                  >
                    {selectedColor === color.value && <span className="plp-color-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="plp-filter-group">
              <h4 className="plp-filter-title">KÍCH THƯỚC</h4>
              <div className="plp-size-list">
                {SIZE_OPTIONS.map(size => (
                  <button
                    key={size}
                    className={`plp-size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => handleSizeSelect(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {mobileFilterOpen && (
            <div className="plp-sidebar-overlay" onClick={() => setMobileFilterOpen(false)} />
          )}

          <main className="plp-main">
            <div className="plp-toolbar">
              <p className="plp-result-count">
                Hiển thị <strong>{products.length}</strong> trong <strong>{totalProducts}</strong> sản phẩm
              </p>
              <div className="plp-sort">
                <label htmlFor="plp-sort-select">Sắp xếp:</label>
                <select id="plp-sort-select" value={sortBy} onChange={handleSortChange}>
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="plp-loading">
                <div className="plp-spinner" />
                <p>Đang tải sản phẩm...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="plp-grid">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <ReactPaginate
                    pageCount={totalPages}
                    forcePage={currentPage - 1}
                    onPageChange={handlePageChange}
                    containerClassName="plp-pagination"
                    activeClassName="active"
                    previousLabel="‹"
                    nextLabel="›"
                    breakLabel="..."
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={1}
                  />
                )}
              </>
            ) : (
              <div className="plp-empty">
                <img
                  src="https://placehold.co/200x200/f8f9fa/9ca3af?text=No+Products"
                  alt="Không tìm thấy sản phẩm"
                />
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Vui lòng thử lại với bộ lọc khác hoặc <Link to="/san-pham">xem tất cả sản phẩm</Link></p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
