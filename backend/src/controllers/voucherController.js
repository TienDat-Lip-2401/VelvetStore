const { Op } = require('sequelize');
const { Voucher } = require('../models');

// GET / - Lấy danh sách voucher (admin)
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search;

    const where = {};
    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: vouchers } = await Voucher.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Lấy danh sách mã giảm giá thành công',
      vouchers,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách mã giảm giá. Vui lòng thử lại sau'
    });
  }
};

// GET /:id - Lấy chi tiết voucher (admin)
const getById = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    res.json({
      message: 'Lấy thông tin mã giảm giá thành công',
      voucher
    });
  } catch (error) {
    console.error('Get voucher error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy thông tin mã giảm giá. Vui lòng thử lại sau'
    });
  }
};

// POST / - Tạo voucher (admin)
const create = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, startDate, endDate, isActive } = req.body;

    if (!code || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ thông tin: mã, loại giảm giá, giá trị, ngày bắt đầu và ngày kết thúc'
      });
    }

    if (!['percent', 'fixed'].includes(discountType)) {
      return res.status(400).json({
        message: 'Loại giảm giá phải là "percent" (phần trăm) hoặc "fixed" (cố định)'
      });
    }

    if (discountType === 'percent' && Number(discountValue) > 100) {
      return res.status(400).json({
        message: 'Giá trị giảm giá theo phần trăm không được vượt quá 100%'
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: 'Ngày kết thúc phải sau ngày bắt đầu'
      });
    }

    const existingCode = await Voucher.findOne({ where: { code: code.toUpperCase() } });
    if (existingCode) {
      return res.status(409).json({
        message: 'Mã giảm giá này đã tồn tại'
      });
    }

    const voucher = await Voucher.create({
      code: code.toUpperCase(),
      description: description || null,
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      startDate,
      endDate,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      message: 'Tạo mã giảm giá thành công',
      voucher
    });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi tạo mã giảm giá. Vui lòng thử lại sau'
    });
  }
};

// PUT /:id - Cập nhật voucher (admin)
const update = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, startDate, endDate, isActive } = req.body;

    if (code && code.toUpperCase() !== voucher.code) {
      const existingCode = await Voucher.findOne({
        where: { code: code.toUpperCase(), id: { [Op.ne]: voucher.id } }
      });
      if (existingCode) {
        return res.status(409).json({
          message: 'Mã giảm giá này đã tồn tại'
        });
      }
    }

    if (discountType && !['percent', 'fixed'].includes(discountType)) {
      return res.status(400).json({
        message: 'Loại giảm giá phải là "percent" (phần trăm) hoặc "fixed" (cố định)'
      });
    }

    const finalDiscountType = discountType || voucher.discountType;
    const finalDiscountValue = discountValue !== undefined ? discountValue : voucher.discountValue;
    if (finalDiscountType === 'percent' && Number(finalDiscountValue) > 100) {
      return res.status(400).json({
        message: 'Giá trị giảm giá theo phần trăm không được vượt quá 100%'
      });
    }

    const newStartDate = startDate || voucher.startDate;
    const newEndDate = endDate || voucher.endDate;
    if (new Date(newStartDate) >= new Date(newEndDate)) {
      return res.status(400).json({
        message: 'Ngày kết thúc phải sau ngày bắt đầu'
      });
    }

    await voucher.update({
      code: code ? code.toUpperCase() : voucher.code,
      description: description !== undefined ? description : voucher.description,
      discountType: discountType || voucher.discountType,
      discountValue: discountValue !== undefined ? discountValue : voucher.discountValue,
      minOrderValue: minOrderValue !== undefined ? minOrderValue : voucher.minOrderValue,
      maxDiscount: maxDiscount !== undefined ? maxDiscount : voucher.maxDiscount,
      usageLimit: usageLimit !== undefined ? usageLimit : voucher.usageLimit,
      startDate: newStartDate,
      endDate: newEndDate,
      isActive: isActive !== undefined ? isActive : voucher.isActive
    });

    res.json({
      message: 'Cập nhật mã giảm giá thành công',
      voucher
    });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật mã giảm giá. Vui lòng thử lại sau'
    });
  }
};

// DELETE /:id - Xóa voucher (admin)
const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    await voucher.destroy();

    res.json({
      message: 'Xóa mã giảm giá thành công'
    });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa mã giảm giá. Vui lòng thử lại sau'
    });
  }
};

// POST /validate - Kiểm tra và áp dụng mã giảm giá
const validate = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    if (!code) {
      return res.status(400).json({
        message: 'Vui lòng nhập mã giảm giá'
      });
    }

    if (!orderTotal || orderTotal <= 0) {
      return res.status(400).json({
        message: 'Giá trị đơn hàng không hợp lệ'
      });
    }

    const voucher = await Voucher.findOne({
      where: { code: code.toUpperCase() }
    });

    if (!voucher) {
      return res.status(404).json({
        message: 'Mã giảm giá không tồn tại'
      });
    }

    // Kiểm tra trạng thái hoạt động
    if (!voucher.isActive) {
      return res.status(400).json({
        message: 'Mã giảm giá đã bị vô hiệu hóa'
      });
    }

    // Kiểm tra thời gian hiệu lực
    const now = new Date();
    if (now < new Date(voucher.startDate)) {
      return res.status(400).json({
        message: 'Mã giảm giá chưa đến thời gian sử dụng'
      });
    }

    if (now > new Date(voucher.endDate)) {
      return res.status(400).json({
        message: 'Mã giảm giá đã hết hạn'
      });
    }

    // Kiểm tra số lượt sử dụng
    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({
        message: 'Mã giảm giá đã hết lượt sử dụng'
      });
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (parseFloat(orderTotal) < parseFloat(voucher.minOrderValue)) {
      return res.status(400).json({
        message: `Đơn hàng tối thiểu ${Number(voucher.minOrderValue).toLocaleString('vi-VN')}đ để sử dụng mã này`
      });
    }

    // Tính giá trị giảm giá
    let discount = 0;
    if (voucher.discountType === 'percent') {
      discount = Math.floor(parseFloat(orderTotal) * parseFloat(voucher.discountValue) / 100);
      if (voucher.maxDiscount !== null && discount > parseFloat(voucher.maxDiscount)) {
        discount = parseFloat(voucher.maxDiscount);
      }
    } else {
      discount = parseFloat(voucher.discountValue);
    }

    // Đảm bảo giảm giá không vượt quá giá trị đơn hàng
    if (discount > parseFloat(orderTotal)) {
      discount = parseFloat(orderTotal);
    }

    res.json({
      message: 'Mã giảm giá hợp lệ',
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        description: voucher.description
      },
      discount
    });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi kiểm tra mã giảm giá. Vui lòng thử lại sau'
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteVoucher,
  validate
};
