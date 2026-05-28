const { Address } = require('../models');

// GET / - Lấy danh sách địa chỉ của người dùng
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      message: 'Lấy danh sách địa chỉ thành công',
      addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách địa chỉ. Vui lòng thử lại sau'
    });
  }
};

// POST / - Tạo địa chỉ mới
const createAddress = async (req, res) => {
  try {
    const { fullName, phone, province, district, ward, street, isDefault } = req.body;

    if (!fullName || !phone || !province || !district || !ward || !street) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ thông tin địa chỉ'
      });
    }

    // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    // Nếu là địa chỉ đầu tiên, tự động đặt làm mặc định
    const count = await Address.count({ where: { userId: req.user.id } });
    const shouldBeDefault = isDefault || count === 0;

    const address = await Address.create({
      userId: req.user.id,
      fullName,
      phone,
      province,
      district,
      ward,
      street,
      isDefault: shouldBeDefault
    });

    res.status(201).json({
      message: 'Thêm địa chỉ thành công',
      address
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi thêm địa chỉ. Vui lòng thử lại sau'
    });
  }
};

// PUT /:id - Cập nhật địa chỉ
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, province, district, ward, street, isDefault } = req.body;

    const address = await Address.findByPk(id);

    if (!address) {
      return res.status(404).json({
        message: 'Không tìm thấy địa chỉ'
      });
    }

    if (address.userId !== req.user.id) {
      return res.status(403).json({
        message: 'Bạn không có quyền chỉnh sửa địa chỉ này'
      });
    }

    // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    await address.update({
      fullName: fullName || address.fullName,
      phone: phone || address.phone,
      province: province || address.province,
      district: district || address.district,
      ward: ward || address.ward,
      street: street || address.street,
      isDefault: isDefault !== undefined ? isDefault : address.isDefault
    });

    res.json({
      message: 'Cập nhật địa chỉ thành công',
      address
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật địa chỉ. Vui lòng thử lại sau'
    });
  }
};

// DELETE /:id - Xóa địa chỉ
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findByPk(id);

    if (!address) {
      return res.status(404).json({
        message: 'Không tìm thấy địa chỉ'
      });
    }

    if (address.userId !== req.user.id) {
      return res.status(403).json({
        message: 'Bạn không có quyền xóa địa chỉ này'
      });
    }

    const wasDefault = address.isDefault;
    await address.destroy();

    // Nếu xóa địa chỉ mặc định, đặt địa chỉ mới nhất làm mặc định
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
      if (nextAddress) {
        await nextAddress.update({ isDefault: true });
      }
    }

    res.json({
      message: 'Xóa địa chỉ thành công'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa địa chỉ. Vui lòng thử lại sau'
    });
  }
};

// PUT /:id/default - Đặt địa chỉ mặc định
const setDefault = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findByPk(id);

    if (!address) {
      return res.status(404).json({
        message: 'Không tìm thấy địa chỉ'
      });
    }

    if (address.userId !== req.user.id) {
      return res.status(403).json({
        message: 'Bạn không có quyền thay đổi địa chỉ này'
      });
    }

    // Bỏ mặc định tất cả địa chỉ khác
    await Address.update(
      { isDefault: false },
      { where: { userId: req.user.id } }
    );

    await address.update({ isDefault: true });

    res.json({
      message: 'Đặt địa chỉ mặc định thành công',
      address
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi đặt địa chỉ mặc định. Vui lòng thử lại sau'
    });
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefault
};
