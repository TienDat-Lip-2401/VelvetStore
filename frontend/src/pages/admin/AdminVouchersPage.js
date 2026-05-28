import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from 'react-icons/fi';
import { adminAPI } from '../../api';
import { formatPrice } from '../../utils/formatPrice';
import './AdminVouchersPage.css';

const AdminVouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    quantity: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getVouchers({ page, limit: 10, search });
      setVouchers(res.vouchers || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Lỗi khi tải voucher:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const openCreateModal = () => {
    setEditingVoucher(null);
    setForm({
      code: '',
      type: 'percent',
      value: '',
      minOrderAmount: '',
      maxDiscount: '',
      quantity: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = async (voucher) => {
    const mapVoucherToForm = (v) => ({
      code: v.code || '',
      type: v.discountType || 'percent',
      value: v.discountValue || '',
      minOrderAmount: v.minOrderValue || '',
      maxDiscount: v.maxDiscount || '',
      quantity: v.usageLimit || '',
      startDate: v.startDate ? v.startDate.slice(0, 10) : '',
      endDate: v.endDate ? v.endDate.slice(0, 10) : '',
      isActive: v.isActive !== false,
    });
    try {
      const res = await adminAPI.getVoucher(voucher.id);
      const v = res.voucher || voucher;
      setEditingVoucher(v);
      setForm(mapVoucherToForm(v));
      setShowModal(true);
    } catch (err) {
      setEditingVoucher(voucher);
      setForm(mapVoucherToForm(voucher));
      setShowModal(true);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) return;

    try {
      setSaving(true);
      const payload = {
        code: form.code,
        discountType: form.type,
        discountValue: Number(form.value),
        minOrderValue: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.quantity ? Number(form.quantity) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isActive: form.isActive,
      };

      if (editingVoucher) {
        await adminAPI.updateVoucher(editingVoucher.id, payload);
      } else {
        await adminAPI.createVoucher(payload);
      }

      setShowModal(false);
      fetchVouchers();
    } catch (err) {
      alert('Lỗi khi lưu voucher: ' + (err.message || 'Đã có lỗi xảy ra'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (voucher) => {
    if (!window.confirm(`Bạn có chắc muốn xóa voucher "${voucher.code}"?`)) return;
    try {
      await adminAPI.deleteVoucher(voucher.id);
      fetchVouchers();
    } catch (err) {
      alert('Lỗi khi xóa voucher');
    }
  };

  const isExpired = (v) => {
    if (!v.endDate) return false;
    return new Date(v.endDate) < new Date();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  if (loading && vouchers.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="admin-vouchers-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý mã giảm giá</h1>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Thêm voucher
        </button>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-form">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm mã giảm giá..."
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
        <table className="admin-table vouchers-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Đơn tối thiểu</th>
              <th>Số lượng</th>
              <th>Hạn sử dụng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-text">Chưa có voucher nào</td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="voucher-code">{v.code}</td>
                  <td>
                    <span className={`voucher-type type-${v.discountType}`}>
                      {v.discountType === 'percent' ? 'Phần trăm' : 'Cố định'}
                    </span>
                  </td>
                  <td className="voucher-value">
                    {v.discountType === 'percent' ? `${v.discountValue}%` : formatPrice(v.discountValue)}
                  </td>
                  <td>{v.minOrderValue ? formatPrice(v.minOrderValue) : '---'}</td>
                  <td>{v.usageLimit != null ? `${v.usedCount || 0}/${v.usageLimit}` : 'Không giới hạn'}</td>
                  <td>
                    {v.endDate
                      ? new Date(v.endDate).toLocaleDateString('vi-VN')
                      : 'Không giới hạn'}
                  </td>
                  <td>
                    <span
                      className={`voucher-status ${
                        isExpired(v) ? 'expired' : v.isActive !== false ? 'active' : 'inactive'
                      }`}
                    >
                      {isExpired(v) ? 'Hết hạn' : v.isActive !== false ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon btn-edit" onClick={() => openEditModal(v)} title="Sửa">
                        <FiEdit2 />
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => handleDelete(v)} title="Xóa">
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVoucher ? 'Sửa voucher' : 'Thêm voucher mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Mã giảm giá *</label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    placeholder="VD: GIAM20"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="form-group">
                  <label>Loại giảm giá *</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Cố định (VNĐ)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Giá trị *</label>
                  <input
                    name="value"
                    type="number"
                    value={form.value}
                    onChange={handleChange}
                    required
                    min={0}
                    placeholder={form.type === 'percent' ? 'VD: 20' : 'VD: 50000'}
                  />
                </div>
                <div className="form-group">
                  <label>Giảm tối đa</label>
                  <input
                    name="maxDiscount"
                    type="number"
                    value={form.maxDiscount}
                    onChange={handleChange}
                    min={0}
                    placeholder="VD: 100000"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Đơn tối thiểu</label>
                  <input
                    name="minOrderAmount"
                    type="number"
                    value={form.minOrderAmount}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label>Số lượng</label>
                  <input
                    name="quantity"
                    type="number"
                    value={form.quantity}
                    onChange={handleChange}
                    min={0}
                    placeholder="Để trống = không giới hạn"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <input name="startDate" type="date" value={form.startDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group form-checkbox">
                <label>
                  <input
                    name="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                  <span>Kích hoạt voucher</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingVoucher ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVouchersPage;
