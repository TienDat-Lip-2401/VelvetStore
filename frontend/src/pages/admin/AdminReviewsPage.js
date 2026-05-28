import { useState, useEffect, useCallback } from 'react';
import { FiTrash2, FiEye, FiEyeOff, FiSearch, FiX, FiStar } from 'react-icons/fi';
import { adminAPI } from '../../api';
import './AdminReviewsPage.css';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toggling, setToggling] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReviews({ page, limit: 10, search });
      setReviews(res.reviews || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Lỗi khi tải đánh giá:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleVisibility = async (review) => {
    try {
      setToggling(review.id);
      await adminAPI.toggleReviewVisibility(review.id);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id
            ? { ...r, isVisible: !r.isVisible, isHidden: !r.isHidden }
            : r
        )
      );
    } catch (err) {
      alert('Lỗi khi thay đổi trạng thái hiển thị');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (review) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await adminAPI.deleteReview(review.id);
      fetchReviews();
    } catch (err) {
      alert('Lỗi khi xóa đánh giá');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={`star ${i < rating ? 'filled' : ''}`}
      />
    ));
  };

  const isVisible = (review) => {
    return review.isVisible !== false && !review.isHidden;
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="admin-reviews-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý đánh giá</h1>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-form">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo sản phẩm, khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="clear-search" onClick={() => { setSearch(''); setPage(1); }}>
              <FiX />
            </button>
          )}
        </form>
      </div>

      <div className="table-wrapper">
        <table className="admin-table reviews-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Khách hàng</th>
              <th>Đánh giá</th>
              <th>Nội dung</th>
              <th>Ngày</th>
              <th>Hiển thị</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-text">Chưa có đánh giá nào</td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} className={!isVisible(r) ? 'row-hidden' : ''}>
                  <td className="review-product">
                    {r.product?.name || r.productName || 'N/A'}
                  </td>
                  <td>{r.user?.fullName || 'Ẩn danh'}</td>
                  <td>
                    <div className="stars-row">
                      {renderStars(r.rating)}
                    </div>
                  </td>
                  <td className="review-content-cell">
                    {r.comment || '---'}
                  </td>
                  <td className="review-date">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <span className={`visibility-badge ${isVisible(r) ? 'visible' : 'hidden'}`}>
                      {isVisible(r) ? 'Hiện' : 'Ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button
                        className={`btn-icon ${isVisible(r) ? 'btn-hide' : 'btn-show'}`}
                        onClick={() => handleToggleVisibility(r)}
                        disabled={toggling === r.id}
                        title={isVisible(r) ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                      >
                        {isVisible(r) ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(r)}
                        title="Xóa"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau</button>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
