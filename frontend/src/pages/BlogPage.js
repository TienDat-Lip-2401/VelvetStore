import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiCalendar } from 'react-icons/fi';
import { blogAPI } from '../api';
import './BlogPage.css';

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await blogAPI.getAll();
        setBlogs(res.data?.data || res.data || res.blogs || []);
      } catch (error) {
        console.error('Lỗi khi tải bài viết:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="blog-page">
      <div className="blog-breadcrumb">
        <div className="container">
          <Link to="/">Trang chủ</Link>
          <FiChevronRight size={14} />
          <span>Bài viết</span>
        </div>
      </div>

      <div className="container">
        <div className="blog-header">
          <h1 className="blog-page-title">Bài Viết Thời Trang</h1>
          <p className="blog-page-subtitle">
            Cập nhật xu hướng, mẹo phối đồ và phong cách thời trang mới nhất
          </p>
        </div>

        {loading ? (
          <div className="blog-loading">
            <div className="spinner" />
            <p>Đang tải bài viết...</p>
          </div>
        ) : blogs.length > 0 ? (
          <div className="blog-grid">
            {blogs.map((blog) => (
              <Link
                to={`/bai-viet/${blog.slug}`}
                key={blog.id}
                className="blog-card"
              >
                <div className="blog-card-image">
                  <img
                    src={blog.thumbnail || 'https://placehold.co/400x250/f0f0f0/999?text=Blog'}
                    alt={blog.title}
                  />
                </div>
                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <FiCalendar size={14} />
                    <span>{formatDate(blog.createdAt)}</span>
                  </div>
                  <h3 className="blog-card-title">{blog.title}</h3>
                  <p className="blog-card-excerpt">
                    {blog.excerpt || blog.description || ''}
                  </p>
                  <span className="blog-card-link">
                    Đọc thêm <FiChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="blog-empty">
            <h3>Chưa có bài viết nào</h3>
            <p>Các bài viết sẽ được cập nhật sớm.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
