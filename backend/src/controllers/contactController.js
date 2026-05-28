const { Contact } = require('../models');

// POST / - Gửi form liên hệ
const create = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ họ tên, email, tiêu đề và nội dung'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Địa chỉ email không hợp lệ'
      });
    }

    const contact = await Contact.create({
      name,
      email,
      phone: phone || null,
      subject,
      message
    });

    res.status(201).json({
      message: 'Gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất có thể',
      contact
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi gửi liên hệ. Vui lòng thử lại sau'
    });
  }
};

// GET / - Lấy danh sách liên hệ (admin)
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: contacts } = await Contact.findAndCountAll({
      order: [['isRead', 'ASC'], ['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Lấy danh sách liên hệ thành công',
      contacts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách liên hệ. Vui lòng thử lại sau'
    });
  }
};

// PUT /:id/read - Đánh dấu đã đọc (admin)
const markAsRead = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({
        message: 'Không tìm thấy liên hệ'
      });
    }

    await contact.update({ isRead: true });

    res.json({
      message: 'Đã đánh dấu liên hệ là đã đọc',
      contact
    });
  } catch (error) {
    console.error('Mark contact as read error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật liên hệ. Vui lòng thử lại sau'
    });
  }
};

module.exports = {
  create,
  getAll,
  markAsRead
};
