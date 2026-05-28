import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { categoryAPI, adminAPI } from '../../api';
import { toast } from 'react-toastify';
import './AdminCategoriesPage.css';

const emptyForm = {
  name: '',
  slug: '',
  parentId: '',
  description: '',
};

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll();
      // Flatten category tree for table display
      const flattenCategories = (cats, result = []) => {
        cats.forEach((cat) => {
          result.push(cat);
          if (cat.children && cat.children.length > 0) {
            flattenCategories(cat.children, result);
          }
        });
        return result;
      };
      setCategories(flattenCategories(res.categories || []));
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      parentId: cat.parentId || '',
      description: cat.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setSaving(true);
      const autoSlug = form.slug || form.name
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
        parentId: form.parentId ? Number(form.parentId) : null,
      };

      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.id, payload);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await adminAPI.createCategory(payload);
        toast.success('Thêm danh mục thành công');
      }

      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error('Lỗi khi lưu danh mục: ' + (err.message || 'Đã có lỗi xảy ra'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminAPI.deleteCategory(deleteId);
      toast.success('Xóa danh mục thành công');
      setDeleteId(null);
      fetchCategories();
    } catch (err) {
      toast.error('Xóa danh mục thất bại');
    }
  };

  const getParentName = (parentId) => {
    if (!parentId) return '---';
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : '---';
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="admin-categories-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý danh mục</h1>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Thêm danh mục
        </button>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên danh mục</th>
              <th>Slug</th>
              <th>Danh mục cha</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-text">Chưa có danh mục nào</td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="cat-name-cell">{cat.name}</td>
                  <td className="cat-slug-cell">{cat.slug || '---'}</td>
                  <td>{getParentName(cat.parentId)}</td>
                  <td>
                    <span className={`cat-status ${cat.isActive !== false ? 'active' : 'inactive'}`}>
                      {cat.isActive !== false ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon btn-edit" onClick={() => openEditModal(cat)} title="Sửa">
                        <FiEdit2 />
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteId(cat.id)} title="Xóa">
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Tên danh mục *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input name="slug" value={form.slug} onChange={handleChange} placeholder="Tự động tạo nếu để trống" />
              </div>
              <div className="form-group">
                <label>Danh mục cha</label>
                <select name="parentId" value={form.parentId} onChange={handleChange}>
                  <option value="">Không có (danh mục gốc)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa danh mục này? Các sản phẩm thuộc danh mục sẽ không bị xóa.</p>
            </div>
            <div className="modal-actions" style={{ padding: '0 20px 20px' }}>
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="btn-danger" onClick={handleDelete}>Xóa danh mục</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
