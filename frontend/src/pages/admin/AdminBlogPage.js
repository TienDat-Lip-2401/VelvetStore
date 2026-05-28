import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiFileText, FiUpload } from 'react-icons/fi';
import { adminAPI } from '../../api';
import { useModal } from '../../context/ModalContext';
import './AdminBlogPage.css';

const AdminBlogPage = () => {
  const { showModal: showWarning } = useModal();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    thumbnail: '',
    status: 'draft',
  });

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getBlogs({ page, limit: 10, search });
      setPosts(res.blogs || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Lỗi khi tải bài viết:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const openCreateModal = () => {
    setEditingPost(null);
    setForm({ title: '', slug: '', content: '', excerpt: '', thumbnail: '', status: 'draft' });
    setShowModal(true);
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      thumbnail: post.thumbnail || '',
      status: post.isPublished ? 'published' : 'draft',
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      setUploadingThumb(true);
      const res = await adminAPI.uploadImage(formData);
      setForm((prev) => ({ ...prev, thumbnail: res.url }));
    } catch (err) {
      showWarning('Lỗi khi tải ảnh lên: ' + (err.message || 'Đã có lỗi xảy ra'), 'danger');
    } finally {
      setUploadingThumb(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;

    try {
      setSaving(true);
      const autoSlug = form.slug || form.title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      const payload = {
        ...form,
        slug: autoSlug,
        isPublished: form.status === 'published',
      };
      delete payload.status;
      if (editingPost) {
        await adminAPI.updateBlog(editingPost.id, payload);
      } else {
        await adminAPI.createBlog(payload);
      }
      setShowModal(false);
      fetchPosts();
    } catch (err) {
      showWarning('Lỗi khi lưu bài viết: ' + (err.message || 'Đã có lỗi xảy ra'), 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài viết "${post.title}"?`)) return;
    try {
      await adminAPI.deleteBlog(post.id);
      fetchPosts();
    } catch (err) {
      showWarning('Lỗi khi xóa bài viết', 'danger');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  if (loading && posts.length === 0 && !searchQuery) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="admin-blog-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý bài viết</h1>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Thêm bài viết
        </button>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-form">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-search" onClick={() => { setSearchQuery(''); setSearch(''); setPage(1); }}>
              <FiX />
            </button>
          )}
        </form>
      </div>

      <div className="table-wrapper">
        <table className="admin-table blog-table">
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tiêu đề</th>
              <th>Tóm tắt</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-text">Chưa có bài viết nào</td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    {post.thumbnail ? (
                      <img src={post.thumbnail} alt={post.title} className="blog-thumb" />
                    ) : (
                      <div className="blog-thumb-empty"><FiFileText /></div>
                    )}
                  </td>
                  <td className="blog-title-cell">{post.title}</td>
                  <td className="blog-excerpt-cell">{post.excerpt || '---'}</td>
                  <td>
                    <span className={`blog-status status-${post.isPublished ? 'published' : 'draft'}`}>
                      {post.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="blog-date">
                    {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon btn-edit" onClick={() => openEditModal(post)} title="Sửa">
                        <FiEdit2 />
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => handleDelete(post)} title="Xóa">
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPost ? 'Sửa bài viết' : 'Thêm bài viết mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Tiêu đề *</label>
                  <input name="title" value={form.title} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Slug</label>
                  <input name="slug" value={form.slug} onChange={handleChange} placeholder="Tự động tạo nếu để trống" />
                </div>
              </div>
              <div className="form-group">
                <label>Tóm tắt</label>
                <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows={2} />
              </div>
              <div className="form-group">
                <label>Nội dung *</label>
                <textarea name="content" value={form.content} onChange={handleChange} rows={10} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Hình ảnh bài viết</label>
                  <div className="blog-thumb-upload">
                    {form.thumbnail ? (
                      <div className="blog-thumb-preview">
                        <img src={form.thumbnail} alt="Thumbnail" />
                        <button type="button" className="blog-thumb-remove" onClick={() => setForm((prev) => ({ ...prev, thumbnail: '' }))}>
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <label className="blog-thumb-picker">
                        <FiUpload />
                        <span>{uploadingThumb ? 'Đang tải...' : 'Chọn ảnh'}</span>
                        <input type="file" accept="image/*" onChange={handleThumbnailUpload} hidden disabled={uploadingThumb} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="draft">Bản nháp</option>
                    <option value="published">Xuất bản</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingPost ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogPage;
