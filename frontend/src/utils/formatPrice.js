export const formatPrice = (price) => {
  if (!price && price !== 0) return '0₫';
  return new Intl.NumberFormat('vi-VN').format(price) + '₫';
};

export const slugify = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};
