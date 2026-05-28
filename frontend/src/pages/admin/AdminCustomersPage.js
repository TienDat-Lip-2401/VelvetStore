import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { adminAPI } from '../../api';
import { useModal } from '../../context/ModalContext';
import './AdminCustomersPage.css';

const AdminCustomersPage = () => {
  const { showModal: showWarning } = useModal();
  const [customers, setCustomers] = useState([]);
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
  const [toggling, setToggling] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getCustomers({ page, limit: 10, search });
      setCustomers(res.customers || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Lỗi khi tải khách hàng:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleToggleStatus = async (customer) => {
    try {
      setToggling(customer.id);
      await adminAPI.toggleCustomerStatus(customer.id);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? { ...c, isActive: !c.isActive }
            : c
        )
      );
    } catch (err) {
      showWarning('Lỗi khi thay đổi trạng thái tài khoản', 'danger');
    } finally {
      setToggling(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const isActive = (customer) => {
    return customer.isActive !== false;
  };

  if (loading && customers.length === 0 && !searchQuery) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="admin-customers-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý khách hàng</h1>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-form">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
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
        <table className="admin-table customers-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Đơn hàng</th>
              <th>Trạng thái</th>
              <th>Ngày đăng ký</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-text">Không có khách hàng nào</td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td className="customer-name">{c.fullName || 'N/A'}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || '---'}</td>
                  <td className="orders-count">{c.ordersCount ?? c.totalOrders ?? 0}</td>
                  <td>
                    <span className={`customer-status ${isActive(c) ? 'active' : 'inactive'}`}>
                      {isActive(c) ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <button
                      className={`btn-toggle ${isActive(c) ? 'active' : ''}`}
                      onClick={() => handleToggleStatus(c)}
                      disabled={toggling === c.id}
                      title={isActive(c) ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      {isActive(c) ? <FiToggleRight /> : <FiToggleLeft />}
                      <span>{isActive(c) ? 'Khóa' : 'Mở khóa'}</span>
                    </button>
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

export default AdminCustomersPage;
