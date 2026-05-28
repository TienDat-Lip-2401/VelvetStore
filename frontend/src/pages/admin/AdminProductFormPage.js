import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiUpload, FiStar, FiImage } from 'react-icons/fi';
import { adminAPI, categoryAPI, productAPI } from '../../api';
import { toast } from 'react-toastify';
import './AdminProductFormPage.css';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  salePrice: '',
  categoryId: '',
  material: '',
  brand: '',
  isFeatured: false,
};

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', '29', '30', '31', '32', 'Free size'];
const COLOR_OPTIONS = ['Trắng', 'Đen', 'Xám', 'Be', 'Xanh đậm', 'Xanh nhạt', 'Đỏ', 'Hồng', 'Nâu', 'Kem'];

const AdminProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Variants
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({ size: '', color: '', stock: '', sku: '' });
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editVariantData, setEditVariantData] = useState({ size: '', color: '', stock: '', sku: '' });
  const [variantSaving, setVariantSaving] = useState(false);

  // Brands & Materials
  const [brands, setBrands] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);

  // Images
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // For create mode

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryAPI.getAll();
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
      console.error(err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await adminAPI.getBrands();
      setBrands(res.brands || []);
    } catch {}
  }, []);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await adminAPI.getMaterials();
      setMaterials(res.materials || []);
    } catch {}
  }, []);

  const handleAddBrand = async () => {
    if (!newBrand.trim()) return;
    try {
      setAddingBrand(true);
      const res = await adminAPI.createBrand({ name: newBrand.trim() });
      const created = res.brand;
      setBrands((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((prev) => ({ ...prev, brand: created.name }));
      setNewBrand('');
      toast.success('Thêm thương hiệu thành công');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi thêm thương hiệu');
    } finally {
      setAddingBrand(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.trim()) return;
    try {
      setAddingMaterial(true);
      const res = await adminAPI.createMaterial({ name: newMaterial.trim() });
      const created = res.material;
      setMaterials((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((prev) => ({ ...prev, material: created.name }));
      setNewMaterial('');
      toast.success('Thêm chất liệu thành công');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi thêm chất liệu');
    } finally {
      setAddingMaterial(false);
    }
  };

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await productAPI.getById(id);
      const p = res.product || res;
      setForm({
        name: p.name || '',
        slug: p.slug || '',
        description: p.description || '',
        price: p.price || '',
        salePrice: p.salePrice || '',
        categoryId: p.categoryId || '',
        material: p.material || '',
        brand: p.brand || '',
        isFeatured: p.isFeatured || false,
      });
      setVariants(p.variants || []);
    } catch {
      toast.error('Không tìm thấy sản phẩm');
      navigate('/admin/san-pham');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchImages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await adminAPI.getProductImages(id);
      setImages(res.images || res || []);
    } catch {
      setImages([]);
    }
  }, [id]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchMaterials();
  }, [fetchCategories, fetchBrands, fetchMaterials]);

  useEffect(() => {
    if (isEdit) {
      fetchProduct();
      fetchImages();
    }
  }, [isEdit, fetchProduct, fetchImages]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Vui lòng nhập tên và giá sản phẩm');
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
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      };

      if (isEdit) {
        await adminAPI.updateProduct(id, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        const res = await adminAPI.createProduct(payload);
        const newId = res.product?.id || res.id;

        // Gửi các biến thể đã thêm local lên server
        if (newId && variants.length > 0) {
          const pendingVariants = variants.filter((v) => v._tempId);
          for (const v of pendingVariants) {
            try {
              await adminAPI.addVariant(newId, {
                size: v.size,
                color: v.color,
                stock: v.stock,
                sku: v.sku || null,
              });
            } catch (err) {
              console.error('Lỗi thêm biến thể:', err);
            }
          }
        }

        // Upload ảnh đã chọn
        if (newId && pendingFiles.length > 0) {
          const formData = new FormData();
          pendingFiles.forEach((f) => formData.append('images', f.file));
          try {
            await adminAPI.uploadProductImages(newId, formData);
          } catch (err) {
            console.error('Lỗi upload ảnh:', err);
          }
          pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
          setPendingFiles([]);
        }

        toast.success('Thêm sản phẩm thành công');
        if (newId) {
          navigate(`/admin/san-pham/${newId}`, { replace: true });
        } else {
          navigate('/admin/san-pham');
        }
        return;
      }
    } catch (err) {
      toast.error('Lỗi khi lưu sản phẩm: ' + (err.message || 'Đã có lỗi xảy ra'));
    } finally {
      setSaving(false);
    }
  };

  // Variant handlers
  const handleAddVariant = async () => {
    if (!newVariant.size || !newVariant.color || !newVariant.stock) {
      toast.error('Vui lòng nhập size, màu và số lượng');
      return;
    }

    // Check duplicate
    const duplicate = variants.find((v) => v.size === newVariant.size && v.color === newVariant.color);
    if (duplicate) {
      toast.error('Biến thể với size và màu này đã tồn tại');
      return;
    }

    if (isEdit) {
      // Edit mode: gọi API ngay
      try {
        setVariantSaving(true);
        const res = await adminAPI.addVariant(id, {
          size: newVariant.size,
          color: newVariant.color,
          stock: Number(newVariant.stock),
          sku: newVariant.sku || null,
        });
        const added = res.variant || res;
        setVariants((prev) => [...prev, added]);
        setNewVariant({ size: '', color: '', stock: '', sku: '' });
        toast.success('Thêm biến thể thành công');
      } catch (err) {
        toast.error('Lỗi khi thêm biến thể: ' + (err.message || ''));
      } finally {
        setVariantSaving(false);
      }
    } else {
      // Create mode: lưu local, gửi sau khi tạo sản phẩm
      setVariants((prev) => [...prev, {
        _tempId: Date.now(),
        size: newVariant.size,
        color: newVariant.color,
        stock: Number(newVariant.stock),
        sku: newVariant.sku || null,
      }]);
      setNewVariant({ size: '', color: '', stock: '', sku: '' });
    }
  };

  const startEditVariant = (v) => {
    const editId = v.id || v._tempId;
    setEditingVariantId(editId);
    setEditVariantData({ size: v.size || '', color: v.color || '', stock: v.stock || 0, sku: v.sku || '' });
  };

  const handleUpdateVariant = async () => {
    if (isEdit) {
      // Edit mode: chỉ cập nhật API nếu variant có id thật (đã lưu trên server)
      const variant = variants.find((v) => v.id === editingVariantId);
      if (variant && variant.id) {
        try {
          setVariantSaving(true);
          await adminAPI.updateVariant(editingVariantId, {
            size: editVariantData.size,
            color: editVariantData.color,
            stock: Number(editVariantData.stock),
            sku: editVariantData.sku || null,
          });
          setVariants((prev) =>
            prev.map((v) => (v.id === editingVariantId ? { ...v, ...editVariantData, stock: Number(editVariantData.stock) } : v))
          );
          setEditingVariantId(null);
          toast.success('Cập nhật biến thể thành công');
        } catch (err) {
          toast.error('Lỗi khi cập nhật biến thể');
        } finally {
          setVariantSaving(false);
        }
        return;
      }
    }

    // Create mode hoặc variant local: cập nhật local state
    setVariants((prev) =>
      prev.map((v) => {
        const vId = v.id || v._tempId;
        return vId === editingVariantId ? { ...v, ...editVariantData, stock: Number(editVariantData.stock) } : v;
      })
    );
    setEditingVariantId(null);
  };

  const handleDeleteVariant = async (variantId) => {
    // Nếu variant có id thật (đã lưu server) -> gọi API xóa
    const variant = variants.find((v) => (v.id || v._tempId) === variantId);
    if (variant && variant.id && isEdit) {
      if (!window.confirm('Xóa biến thể này?')) return;
      try {
        await adminAPI.deleteVariant(variant.id);
        setVariants((prev) => prev.filter((v) => v.id !== variant.id));
        toast.success('Xóa biến thể thành công');
      } catch {
        toast.error('Lỗi khi xóa biến thể');
      }
    } else {
      // Local variant (chế độ tạo mới)
      setVariants((prev) => prev.filter((v) => (v.id || v._tempId) !== variantId));
    }
  };

  // Image handlers
  const handleUploadImages = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isEdit) {
      // Edit mode: upload ngay lên server
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
      try {
        setUploading(true);
        await adminAPI.uploadProductImages(id, formData);
        toast.success('Tải ảnh lên thành công');
        fetchImages();
      } catch {
        toast.error('Lỗi khi tải ảnh lên');
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    } else {
      // Create mode: lưu local, upload sau khi tạo sản phẩm
      const newFiles = Array.from(files).map((file) => ({
        _tempId: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
      }));
      setPendingFiles((prev) => [...prev, ...newFiles]);
      e.target.value = '';
    }
  };

  const handleRemovePendingFile = (tempId) => {
    setPendingFiles((prev) => {
      const removed = prev.find((f) => f._tempId === tempId);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f._tempId !== tempId);
    });
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Xóa ảnh này?')) return;
    try {
      await adminAPI.deleteProductImage(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success('Xóa ảnh thành công');
    } catch {
      toast.error('Lỗi khi xóa ảnh');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await adminAPI.setPrimaryImage(imageId);
      setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === imageId })));
      toast.success('Đã đặt ảnh đại diện');
    } catch {
      toast.error('Lỗi khi đặt ảnh đại diện');
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
    <div className="admin-product-form-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/admin/san-pham')}>
          <FiArrowLeft /> Quay lại
        </button>
        <h1 className="page-title">{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h1>
      </div>

      {/* Product Form */}
      <div className="form-card">
        <h2 className="form-card-title">Thông tin sản phẩm</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Tên sản phẩm *</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Slug</label>
              <input name="slug" value={form.slug} onChange={handleChange} placeholder="Tự động tạo nếu để trống" />
            </div>
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Giá bán *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} required min={0} />
            </div>
            <div className="form-group">
              <label>Giá khuyến mãi</label>
              <input name="salePrice" type="number" value={form.salePrice} onChange={handleChange} min={0} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Danh mục</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Thương hiệu</label>
              <div className="select-with-add">
                <select name="brand" value={form.brand} onChange={handleChange}>
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
                <div className="inline-add">
                  <input
                    type="text"
                    placeholder="Thêm mới..."
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBrand())}
                  />
                  <button type="button" className="btn-icon btn-add-inline" onClick={handleAddBrand} disabled={addingBrand} title="Thêm">
                    <FiPlus />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Chất liệu</label>
              <div className="select-with-add">
                <select name="material" value={form.material} onChange={handleChange}>
                  <option value="">-- Chọn chất liệu --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
                <div className="inline-add">
                  <input
                    type="text"
                    placeholder="Thêm mới..."
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMaterial())}
                  />
                  <button type="button" className="btn-icon btn-add-inline" onClick={handleAddMaterial} disabled={addingMaterial} title="Thêm">
                    <FiPlus />
                  </button>
                </div>
              </div>
            </div>
            <div className="form-group" />
          </div>
          <div className="form-group form-checkbox">
            <label>
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
              Sản phẩm nổi bật
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/admin/san-pham')}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>

      {/* Variant Management */}
      <div className="form-card">
        <h2 className="form-card-title">Quản lý biến thể</h2>
          <div className="variant-table-wrapper">
            <table className="variant-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Màu sắc</th>
                  <th>Tồn kho</th>
                  <th>SKU</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id || v._tempId}>
                    {editingVariantId === (v.id || v._tempId) ? (
                      <>
                        <td>
                          <select value={editVariantData.size} onChange={(e) => setEditVariantData((p) => ({ ...p, size: e.target.value }))}>
                            <option value="">Chọn</option>
                            {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>
                          <select value={editVariantData.color} onChange={(e) => setEditVariantData((p) => ({ ...p, color: e.target.value }))}>
                            <option value="">Chọn</option>
                            {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td>
                          <input type="number" value={editVariantData.stock} min={0}
                            onChange={(e) => setEditVariantData((p) => ({ ...p, stock: e.target.value }))} />
                        </td>
                        <td>
                          <input type="text" value={editVariantData.sku}
                            onChange={(e) => setEditVariantData((p) => ({ ...p, sku: e.target.value }))} />
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-icon btn-save" onClick={handleUpdateVariant} disabled={variantSaving} title="Lưu">
                              <FiCheck />
                            </button>
                            <button className="btn-icon" onClick={() => setEditingVariantId(null)} title="Hủy">
                              <FiX />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{v.size || '---'}</td>
                        <td>{v.color || '---'}</td>
                        <td>{v.stock ?? 0}</td>
                        <td>{v.sku || '---'}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-icon btn-edit" onClick={() => startEditVariant(v)} title="Sửa">
                              <FiEdit2 />
                            </button>
                            <button className="btn-icon btn-delete" onClick={() => handleDeleteVariant(v.id || v._tempId)} title="Xóa">
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {/* Add new variant row */}
                <tr className="variant-add-row">
                  <td>
                    <select value={newVariant.size} onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}>
                      <option value="">Chọn size</option>
                      {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={newVariant.color} onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}>
                      <option value="">Chọn màu</option>
                      {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type="number" placeholder="Số lượng" value={newVariant.stock} min={0}
                      onChange={(e) => setNewVariant((p) => ({ ...p, stock: e.target.value }))} />
                  </td>
                  <td>
                    <input type="text" placeholder="SKU (tùy chọn)" value={newVariant.sku}
                      onChange={(e) => setNewVariant((p) => ({ ...p, sku: e.target.value }))} />
                  </td>
                  <td>
                    <button className="btn-primary btn-sm" onClick={handleAddVariant} disabled={variantSaving}>
                      <FiPlus /> Thêm
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {variants.length === 0 && (
            <p className="empty-hint">Chưa có biến thể nào. Thêm biến thể để quản lý size, màu sắc và tồn kho.</p>
          )}
        </div>

      {/* Image Management */}
      <div className="form-card">
        <div className="form-card-header">
          <h2 className="form-card-title">Hình ảnh sản phẩm</h2>
          <label className="btn-primary btn-sm upload-label">
            <FiUpload /> {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
            <input type="file" multiple accept="image/*" onChange={handleUploadImages} hidden disabled={uploading} />
          </label>
        </div>
        {isEdit ? (
          images.length > 0 ? (
            <div className="image-grid">
              {images.map((img) => (
                <div key={img.id} className={`image-item ${img.isPrimary ? 'is-primary' : ''}`}>
                  <img src={img.url} alt="Ảnh sản phẩm" />
                  {img.isPrimary && <span className="primary-badge"><FiStar /> Ảnh chính</span>}
                  <div className="image-actions">
                    {!img.isPrimary && (
                      <button className="img-btn" onClick={() => handleSetPrimary(img.id)} title="Đặt ảnh chính">
                        <FiStar />
                      </button>
                    )}
                    <button className="img-btn img-btn-delete" onClick={() => handleDeleteImage(img.id)} title="Xóa">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-images">
              <FiImage size={40} />
              <p>Chưa có hình ảnh. Tải ảnh lên để hiển thị sản phẩm.</p>
            </div>
          )
        ) : (
          pendingFiles.length > 0 ? (
            <div className="image-grid">
              {pendingFiles.map((f) => (
                <div key={f._tempId} className="image-item">
                  <img src={f.preview} alt="Ảnh chờ tải" />
                  <div className="image-actions">
                    <button className="img-btn img-btn-delete" onClick={() => handleRemovePendingFile(f._tempId)} title="Xóa">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-images">
              <FiImage size={40} />
              <p>Chọn ảnh cho sản phẩm. Ảnh sẽ được tải lên khi bạn thêm sản phẩm.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminProductFormPage;
