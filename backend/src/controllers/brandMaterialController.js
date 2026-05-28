const { Brand, Material } = require('../models');

// Brands
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll({ order: [['name', 'ASC']] });
    res.json({ brands });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách thương hiệu' });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên thương hiệu không được để trống' });
    }
    const existing = await Brand.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'Thương hiệu đã tồn tại' });
    }
    const brand = await Brand.create({ name: name.trim() });
    res.status(201).json({ brand });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo thương hiệu' });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Không tìm thấy thương hiệu' });
    await brand.destroy();
    res.json({ message: 'Xóa thương hiệu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa thương hiệu' });
  }
};

// Materials
const getMaterials = async (req, res) => {
  try {
    const materials = await Material.findAll({ order: [['name', 'ASC']] });
    res.json({ materials });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách chất liệu' });
  }
};

const createMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên chất liệu không được để trống' });
    }
    const existing = await Material.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'Chất liệu đã tồn tại' });
    }
    const material = await Material.create({ name: name.trim() });
    res.status(201).json({ material });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo chất liệu' });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) return res.status(404).json({ message: 'Không tìm thấy chất liệu' });
    await material.destroy();
    res.json({ message: 'Xóa chất liệu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa chất liệu' });
  }
};

module.exports = { getBrands, createBrand, deleteBrand, getMaterials, createMaterial, deleteMaterial };
