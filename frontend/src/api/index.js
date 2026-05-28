import axiosClient from './axiosClient';

// Auth
export const authAPI = {
  register: (data) => axiosClient.post('/auth/register', data),
  login: (data) => axiosClient.post('/auth/login', data),
  getProfile: () => axiosClient.get('/auth/profile'),
  updateProfile: (data) => axiosClient.put('/auth/profile', data),
  changePassword: (data) => axiosClient.put('/auth/change-password', data),
  forgotPassword: (data) => axiosClient.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosClient.post('/auth/reset-password', data),
};

// Products
export const productAPI = {
  getAll: (params) => axiosClient.get('/products', { params }),
  getById: (id) => axiosClient.get(`/products/${id}`),
  getFeatured: () => axiosClient.get('/products/featured'),
  getSale: () => axiosClient.get('/products/sale'),
  getByCategory: (categoryId, params) => axiosClient.get(`/products/category/${categoryId}`, { params }),
};

// Categories
export const categoryAPI = {
  getAll: () => axiosClient.get('/categories'),
  getById: (id) => axiosClient.get(`/categories/${id}`),
};

// Cart
export const cartAPI = {
  getCart: () => axiosClient.get('/cart'),
  addToCart: (data) => axiosClient.post('/cart', data),
  updateQuantity: (id, data) => axiosClient.put(`/cart/${id}`, data),
  removeItem: (id) => axiosClient.delete(`/cart/${id}`),
  clearCart: () => axiosClient.delete('/cart'),
};

// Orders
export const orderAPI = {
  create: (data) => axiosClient.post('/orders', data),
  getMyOrders: (params) => axiosClient.get('/orders/my-orders', { params }),
  getById: (id) => axiosClient.get(`/orders/${id}`),
  cancel: (id) => axiosClient.put(`/orders/${id}/cancel`),
};

// Payment
export const paymentAPI = {
  createVnpayUrl: (data) => axiosClient.post('/payment/create-vnpay-url', data),
};

// Address
export const addressAPI = {
  getAll: () => axiosClient.get('/addresses'),
  create: (data) => axiosClient.post('/addresses', data),
  update: (id, data) => axiosClient.put(`/addresses/${id}`, data),
  delete: (id) => axiosClient.delete(`/addresses/${id}`),
  setDefault: (id) => axiosClient.put(`/addresses/${id}/default`),
};

// Wishlist
export const wishlistAPI = {
  getAll: () => axiosClient.get('/wishlists'),
  add: (data) => axiosClient.post('/wishlists', data),
  remove: (productId) => axiosClient.delete(`/wishlists/${productId}`),
};

// Reviews
export const reviewAPI = {
  getByProduct: (productId, params) => axiosClient.get(`/reviews/product/${productId}`, { params }),
  create: (data) => axiosClient.post('/reviews', data),
};

// Voucher
export const voucherAPI = {
  validate: (data) => axiosClient.post('/vouchers/validate', data),
};

// Blog
export const blogAPI = {
  getAll: (params) => axiosClient.get('/blogs', { params }),
  getBySlug: (slug) => axiosClient.get(`/blogs/${slug}`),
};

// Contact
export const contactAPI = {
  create: (data) => axiosClient.post('/contacts', data),
};

// Admin APIs
export const adminAPI = {
  // Dashboard
  getOrderStats: () => axiosClient.get('/orders/stats'),
  getAllOrders: (params) => axiosClient.get('/orders/admin', { params }),
  updateOrderStatus: (id, data) => axiosClient.put(`/orders/${id}/status`, data),

  // Products
  getProduct: (id) => axiosClient.get(`/products/${id}`),
  getProducts: (params) => axiosClient.get('/admin/products', { params }),
  createProduct: (data) => axiosClient.post('/products', data),
  updateProduct: (id, data) => axiosClient.put(`/products/${id}`, data),
  deleteProduct: (id) => axiosClient.delete(`/products/${id}`),

  // Product Images
  getProductImages: (id) => axiosClient.get(`/admin/products/${id}/images`),
  uploadProductImages: (id, formData) => axiosClient.post(`/admin/products/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProductImage: (id) => axiosClient.delete(`/admin/images/${id}`),
  setPrimaryImage: (id) => axiosClient.put(`/admin/images/${id}/primary`),

  // Variants
  addVariant: (productId, data) => axiosClient.post(`/admin/products/${productId}/variants`, data),
  updateVariant: (id, data) => axiosClient.put(`/admin/variants/${id}`, data),
  deleteVariant: (id) => axiosClient.delete(`/admin/variants/${id}`),

  // Categories
  createCategory: (data) => axiosClient.post('/categories', data),
  updateCategory: (id, data) => axiosClient.put(`/categories/${id}`, data),
  deleteCategory: (id) => axiosClient.delete(`/categories/${id}`),

  // Customers
  getCustomers: (params) => axiosClient.get('/admin/customers', { params }),
  toggleCustomerStatus: (id) => axiosClient.put(`/admin/customers/${id}/toggle-status`),

  // Vouchers
  getVouchers: (params) => axiosClient.get('/vouchers', { params }),
  getVoucher: (id) => axiosClient.get(`/vouchers/${id}`),
  createVoucher: (data) => axiosClient.post('/vouchers', data),
  updateVoucher: (id, data) => axiosClient.put(`/vouchers/${id}`, data),
  deleteVoucher: (id) => axiosClient.delete(`/vouchers/${id}`),

  // Reviews
  getReviews: (params) => axiosClient.get('/reviews/admin', { params }),
  deleteReview: (id) => axiosClient.delete(`/reviews/${id}`),
  toggleReviewVisibility: (id) => axiosClient.put(`/reviews/${id}/toggle`),

  // Reports
  getRevenueReport: (params) => axiosClient.get('/admin/reports/revenue', { params }),
  getBestSellers: () => axiosClient.get('/admin/reports/best-sellers'),
  getLowStock: () => axiosClient.get('/admin/reports/low-stock'),

  // Shipping
  getShippingMethods: () => axiosClient.get('/admin/shipping-methods'),
  createShippingMethod: (data) => axiosClient.post('/admin/shipping-methods', data),
  updateShippingMethod: (id, data) => axiosClient.put(`/admin/shipping-methods/${id}`, data),
  deleteShippingMethod: (id) => axiosClient.delete(`/admin/shipping-methods/${id}`),

  // System Config
  getSystemConfig: () => axiosClient.get('/admin/system-config'),
  updateSystemConfig: (data) => axiosClient.put('/admin/system-config', data),

  // Upload ảnh chung
  uploadImage: (formData) => axiosClient.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Blog
  getBlogs: (params) => axiosClient.get('/blogs/admin', { params }),
  createBlog: (data) => axiosClient.post('/blogs', data),
  updateBlog: (id, data) => axiosClient.put(`/blogs/${id}`, data),
  deleteBlog: (id) => axiosClient.delete(`/blogs/${id}`),

  // Contacts
  getContacts: (params) => axiosClient.get('/contacts', { params }),
  markContactRead: (id) => axiosClient.put(`/contacts/${id}/read`),

  // Brands
  getBrands: () => axiosClient.get('/admin/brands'),
  createBrand: (data) => axiosClient.post('/admin/brands', data),
  deleteBrand: (id) => axiosClient.delete(`/admin/brands/${id}`),

  // Materials
  getMaterials: () => axiosClient.get('/admin/materials'),
  createMaterial: (data) => axiosClient.post('/admin/materials', data),
  deleteMaterial: (id) => axiosClient.delete(`/admin/materials/${id}`),
};
