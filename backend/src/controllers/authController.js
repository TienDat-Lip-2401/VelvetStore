const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// POST /register
const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Địa chỉ email không hợp lệ'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    if (fullName.trim().length < 2) {
      return res.status(400).json({
        message: 'Họ tên phải có ít nhất 2 ký tự'
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác'
      });
    }

    const user = await User.create({
      email,
      password,
      fullName: fullName.trim()
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau'
    });
  }
};

// POST /login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    const token = generateToken(user);

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau'
    });
  }
};

// POST /forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Vui lòng nhập địa chỉ email'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({
        message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

    await user.update({ resetToken, resetTokenExpiry });

    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log(`[Đặt lại mật khẩu] Email: ${email}`);
    console.log(`[Đặt lại mật khẩu] URL: ${resetUrl}`);

    res.json({
      message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau'
    });
  }
};

// POST /reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp token và mật khẩu mới'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới'
      });
    }

    await user.update({
      password,
      resetToken: null,
      resetTokenExpiry: null
    });

    res.json({
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại sau'
    });
  }
};

// GET /profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    res.json({
      message: 'Lấy thông tin hồ sơ thành công',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy thông tin hồ sơ. Vui lòng thử lại sau'
    });
  }
};

// PUT /profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, avatar } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    const updateData = {};

    if (fullName !== undefined) {
      if (fullName.trim().length < 2) {
        return res.status(400).json({
          message: 'Họ tên phải có ít nhất 2 ký tự'
        });
      }
      updateData.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      if (phone && !/^[0-9]{10,11}$/.test(phone)) {
        return res.status(400).json({
          message: 'Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số'
        });
      }
      updateData.phone = phone || null;
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar || null;
    }

    await user.update(updateData);

    res.json({
      message: 'Cập nhật hồ sơ thành công',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật hồ sơ. Vui lòng thử lại sau'
    });
  }
};

// PUT /change-password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    await user.update({ password: newPassword });

    res.json({
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau'
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword
};
