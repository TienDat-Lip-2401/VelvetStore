import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiChevronRight, FiCalendar, FiUser, FiArrowLeft } from 'react-icons/fi';
import { blogAPI } from '../api';
import './BlogDetailPage.css';

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await blogAPI.getBySlug(slug);
        setBlog(res.data?.data || res.data || res.blog || res);
      } catch (error) {
        console.error('Lỗi khi tải bài viết:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="blog-detail-page">
        <div className="container">
          <div className="blog-detail-loading">
            <div className="spinner" />
            <p>Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-detail-page">
        <div className="container">
          <div className="blog-detail-empty">
            <h2>Không tìm thấy bài viết</h2>
            <p>Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <Link to="/bai-viet" className="btn btn-primary">
              <FiArrowLeft size={16} />
              Quay lại danh sách bài viết
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-detail-page">
      <div className="blog-detail-breadcrumb">
        <div className="container">
          <Link to="/">Trang chủ</Link>
          <FiChevronRight size={14} />
          <Link to="/bai-viet">Bài viết</Link>
          <FiChevronRight size={14} />
          <span>{blog.title}</span>
        </div>
      </div>

      <div className="container">
        <article className="blog-detail-article">
          {blog.thumbnail && (
            <div className="blog-detail-thumbnail">
              <img src={blog.thumbnail} alt={blog.title} />
            </div>
          )}

          <h1 className="blog-detail-title">{blog.title}</h1>

          <div className="blog-detail-meta">
            {blog.author && (
              <span className="blog-detail-author">
                <FiUser size={14} />
                {typeof blog.author === 'string' ? blog.author : blog.author.fullName || blog.author.name}
              </span>
            )}
            <span className="blog-detail-date">
              <FiCalendar size={14} />
              {formatDate(blog.createdAt)}
            </span>
          </div>

          <div
            className="blog-detail-content"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          <div className="blog-detail-footer">
            <Link to="/bai-viet" className="blog-back-link">
              <FiArrowLeft size={16} />
              Quay lại danh sách bài viết
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetailPage;
