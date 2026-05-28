import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, addressAPI } from '../api';
import { toast } from 'react-toastify';
import {
  FiUser, FiMapPin, FiLock, FiHeart, FiPackage,
  FiEdit2, FiTrash2, FiPlus, FiCheck, FiX, FiEye, FiEyeOff, FiCamera
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import useProvinces from '../hooks/useProvinces';
import './AccountPage.css';

const TABS = [
  { key: 'profile', label: 'Hồ sơ', icon: FiUser },
  { key: 'address', label: 'Địa chỉ', icon: FiMapPin },
  { key: 'password', label: 'Đổi mật khẩu', icon: FiLock },
  { key: 'wishlist', label: 'Yêu thích', icon: FiHeart, link: '/yeu-thich' },
  { key: 'orders', label: 'Đơn hàng', icon: FiPackage, link: '/don-hang' },
];

const AccountPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="account-page">
      <div className="container">
        <h1 className="account-page-title">Tài khoản của tôi</h1>
        <div className="account-layout">
          <aside className="account-sidebar">
            <div className="account-user-info">
              <div className="account-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName} />
                ) : (
                  <FiUser size={28} />
                )}
              </div>
              <div>
                <p className="account-user-name">{user?.fullName}</p>
                <p className="account-user-email">{user?.email}</p>
              </div>
            </div>
            <nav className="account-nav">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                if (tab.link) {
                  return (
                    <Link key={tab.key} to={tab.link} className="account-nav-item">
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </Link>
                  );
                }
                return (
                  <button
                    key={tab.key}
                    className={`account-nav-item ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="account-content">
            {activeTab === 'profile' && <ProfileTab user={user} updateUser={updateUser} />}
            {activeTab === 'address' && <AddressTab />}
            {activeTab === 'password' && <PasswordTab />}
          </main>
        </div>
      </div>
    </div>
  );
};

/* ======================== Profile Tab ======================== */
const ProfileTab = ({ user, updateUser }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('avatar', file);

    setAvatarLoading(true);
    try {
      const res = await authAPI.updateProfile(fd);
      updateUser(res.user);
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      toast.error('Không thể cập nhật ảnh đại diện');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.updateProfile(formData);
      updateUser(res.user);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error) {
      toast.error('Không thể cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-section">
      <h2 className="account-section-title">Hồ sơ cá nhân</h2>

      <div className="profile-avatar-section">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} />
            ) : (
              <FiUser size={40} />
            )}
          </div>
          <label className="profile-avatar-edit" htmlFor="avatar-upload">
            {avatarLoading ? '...' : <FiCamera size={16} />}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Họ và tên</label>
            <input
              type="text"
              name="fullName"
              className="form-control"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              className="form-control"
              placeholder="Nhập số điện thoại"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={user?.email || ''}
            readOnly
            disabled
          />
          <span className="form-hint">Email không thể thay đổi</span>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ======================== Address Tab ======================== */
const AddressTab = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', province: '', district: '', ward: '', street: '',
  });
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');

  const {
    provinces, districts, wards,
    loadingProvinces, loadingDistricts, loadingWards,
    fetchDistricts, fetchWards,
  } = useProvinces();

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await addressAPI.getAll();
      setAddresses(res.addresses || res);
    } catch {
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const resetForm = () => {
    setFormData({ fullName: '', phone: '', province: '', district: '', ward: '', street: '' });
    setSelectedProvinceCode('');
    setSelectedDistrictCode('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (addr) => {
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      street: addr.street,
    });
    setSelectedProvinceCode('');
    setSelectedDistrictCode('');
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const prov = provinces.find((p) => String(p.code) === code);
    setSelectedProvinceCode(code);
    setSelectedDistrictCode('');
    setFormData({ ...formData, province: prov ? prov.name : '', district: '', ward: '' });
    fetchDistricts(code);
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    const dist = districts.find((d) => String(d.code) === code);
    setSelectedDistrictCode(code);
    setFormData({ ...formData, district: dist ? dist.name : '', ward: '' });
    fetchWards(code);
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const w = wards.find((w) => String(w.code) === code);
    setFormData({ ...formData, ward: w ? w.name : '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.province || !formData.district || !formData.ward || !formData.street) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      if (editingId) {
        await addressAPI.update(editingId, formData);
        toast.success('Cập nhật địa chỉ thành công!');
      } else {
        await addressAPI.create(formData);
        toast.success('Thêm địa chỉ thành công!');
      }
      resetForm();
      fetchAddresses();
    } catch {
      toast.error('Không thể lưu địa chỉ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      await addressAPI.delete(id);
      toast.success('Đã xóa địa chỉ');
      fetchAddresses();
    } catch {
      toast.error('Không thể xóa địa chỉ');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressAPI.setDefault(id);
      toast.success('Đã đặt làm địa chỉ mặc định');
      fetchAddresses();
    } catch {
      toast.error('Không thể đặt địa chỉ mặc định');
    }
  };

  return (
    <div className="account-section">
      <div className="account-section-header">
        <h2 className="account-section-title">Địa chỉ giao hàng</h2>
        {!showForm && (
          <button className="btn btn-outline btn-sm" onClick={() => setShowForm(true)}>
            <FiPlus size={16} />
            <span>Thêm địa chỉ</span>
          </button>
        )}
      </div>

      {showForm && (
        <form className="address-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                className="form-control"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Họ và tên người nhận"
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Số điện thoại"
              />
            </div>
          </div>
          <div className="form-row form-row-3">
            <div className="form-group">
              <label>Tỉnh / Thành phố</label>
              <select
                className="form-control"
                value={selectedProvinceCode}
                onChange={handleProvinceChange}
                disabled={loadingProvinces}
              >
                <option value="">{loadingProvinces ? 'Đang tải...' : '-- Chọn Tỉnh/Thành phố --'}</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quận / Huyện</label>
              <select
                className="form-control"
                value={selectedDistrictCode}
                onChange={handleDistrictChange}
                disabled={!selectedProvinceCode || loadingDistricts}
              >
                <option value="">{loadingDistricts ? 'Đang tải...' : '-- Chọn Quận/Huyện --'}</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Phường / Xã</label>
              <select
                className="form-control"
                value={wards.find((w) => w.name === formData.ward)?.code || ''}
                onChange={handleWardChange}
                disabled={!selectedDistrictCode || loadingWards}
              >
                <option value="">{loadingWards ? 'Đang tải...' : '-- Chọn Phường/Xã --'}</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Địa chỉ cụ thể</label>
            <input
              type="text"
              className="form-control"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="Số nhà, tên đường"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Cập nhật' : 'Thêm địa chỉ'}
            </button>
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Hủy
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-text">Đang tải...</div>
      ) : addresses.length === 0 ? (
        <div className="empty-state">
          <FiMapPin size={40} />
          <p>Chưa có địa chỉ nào</p>
        </div>
      ) : (
        <div className="address-list">
          {addresses.map((addr) => (
            <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
              <div className="address-card-body">
                <div className="address-card-top">
                  <span className="address-name">{addr.fullName}</span>
                  <span className="address-divider">|</span>
                  <span className="address-phone">{addr.phone}</span>
                  {addr.isDefault && (
                    <span className="badge badge-primary">Mặc định</span>
                  )}
                </div>
                <p className="address-detail">
                  {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                </p>
              </div>
              <div className="address-card-actions">
                <button className="btn-icon" title="Chỉnh sửa" onClick={() => handleEdit(addr)}>
                  <FiEdit2 size={15} />
                </button>
                <button className="btn-icon" title="Xóa" onClick={() => handleDelete(addr.id)}>
                  <FiTrash2 size={15} />
                </button>
                {!addr.isDefault && (
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => handleSetDefault(addr.id)}
                  >
                    Đặt mặc định
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ======================== Password Tab ======================== */
const PasswordTab = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { oldPassword, newPassword, confirmPassword } = formData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ oldPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-section">
      <h2 className="account-section-title">Đổi mật khẩu</h2>

      <form className="password-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mật khẩu hiện tại</label>
          <div className="input-wrapper">
            <FiLock className="input-icon" />
            <input
              type={showOld ? 'text' : 'password'}
              name="oldPassword"
              className="form-control"
              placeholder="Nhập mật khẩu hiện tại"
              value={formData.oldPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowOld(!showOld)}
              tabIndex={-1}
            >
              {showOld ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Mật khẩu mới</label>
          <div className="input-wrapper">
            <FiLock className="input-icon" />
            <input
              type={showNew ? 'text' : 'password'}
              name="newPassword"
              className="form-control"
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              value={formData.newPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowNew(!showNew)}
              tabIndex={-1}
            >
              {showNew ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Xác nhận mật khẩu mới</label>
          <div className="input-wrapper">
            <FiLock className="input-icon" />
            <input
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              className="form-control"
              placeholder="Nhập lại mật khẩu mới"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
            >
              {showConfirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountPage;
