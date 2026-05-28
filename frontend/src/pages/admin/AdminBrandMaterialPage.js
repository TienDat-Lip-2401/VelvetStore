import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { adminAPI } from '../../api';
import { toast } from 'react-toastify';
import './AdminBrandMaterialPage.css';

const AdminBrandMaterialPage = ({ type = 'brand' }) => {
  const isBrand = type === 'brand';
  const label = isBrand ? 'thương hiệu' : 'chất liệu';
  const labelCap = isBrand ? 'Thương hiệu' : 'Chất liệu';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchItems = async () => {
    try {
      const res = isBrand
        ? await adminAPI.getBrands()
        : await adminAPI.getMaterials();
      setItems(isBrand ? res.brands || [] : res.materials || []);
    } catch (err) {
      console.error(`Lỗi khi tải ${label}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(`Vui lòng nhập tên ${label}`);
      return;
    }
    try {
      setSaving(true);
      if (isBrand) {
        await adminAPI.createBrand({ name: name.trim() });
      } else {
        await adminAPI.createMaterial({ name: name.trim() });
      }
      toast.success(`Thêm ${label} thành công`);
      setShowModal(false);
      setName('');
      fetchItems();
    } catch (err) {
      toast.error(err.message || `Lỗi khi thêm ${label}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      if (isBrand) {
        await adminAPI.deleteBrand(deleteId);
      } else {
        await adminAPI.deleteMaterial(deleteId);
      }
      toast.success(`Xóa ${label} thành công`);
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      toast.error(`Xóa ${label} thất bại`);
    }
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
    <div className="admin-brand-material-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý {label}</h1>
        <button className="btn-primary" onClick={() => { setName(''); setShowModal(true); }}>
          <FiPlus /> Thêm {label}
        </button>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>STT</th>
              <th>Tên {label}</th>
              <th>Ngày tạo</th>
              <th style={{ width: 100 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-text">Chưa có {label} nào</td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="item-name">{item.name}</td>
                  <td className="item-date">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '---'}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => setDeleteId(item.id)}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm {label} mới</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Tên {label} *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Nhập tên ${label}`}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Thêm mới'}
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
              <p>Bạn có chắc chắn muốn xóa {label} này?</p>
            </div>
            <div className="modal-actions" style={{ padding: '0 20px 20px' }}>
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="btn-danger" onClick={handleDelete}>Xóa {label}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrandMaterialPage;
