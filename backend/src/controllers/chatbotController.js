const { Product, Voucher, ProductImage } = require('../models');
const { Op } = require('sequelize');

/**
 * Xử lý câu hỏi của khách hàng bằng Dual-Engine
 */
const queryChatbot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
    }

    const cleanMessage = message.toLowerCase().trim();
    const cleanNoAccent = cleanMessage
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');

    // 1. CHUẨN BỊ DỮ LIỆU ĐỘNG TỪ DATABASE CHO DUAL-ENGINE
    const activeProducts = await Product.findAll({
      where: { isActive: true },
      include: [{ model: ProductImage, as: 'images', where: { isPrimary: true }, required: false }],
      limit: 15
    });

    const activeVouchers = await Voucher.findAll({
      where: { isActive: true }
    });

    // 2. ENGINE 1: GOOGLE GEMINI AI (Nếu có API Key trong môi trường)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const productsContext = activeProducts.map(p => {
          const priceStr = p.salePrice ? `${p.salePrice}đ (Giá gốc: ${p.price}đ)` : `${p.price}đ`;
          return `- ID: ${p.id}, Tên: ${p.name}, Giá: ${priceStr}, Slug: ${p.slug || ''}`;
        }).join('\n');

        const vouchersContext = activeVouchers.map(v => {
          const discountStr = v.discountType === 'percent' ? `${v.discountValue}%` : `${v.discountValue}đ`;
          return `- Mã: ${v.code}, Giảm giá: ${discountStr}, Đơn hàng tối thiểu: ${v.minOrderValue || 0}đ, Hạn sử dụng: ${v.endDate ? v.endDate.slice(0, 10) : 'Không thời hạn'}`;
        }).join('\n');

        const systemPrompt = `
Bạn là Trợ lý ảo AI cực kỳ thông tin và thân thiện của VelvetStore - Cửa hàng thời trang cao cấp chuyên về váy đầm, áo thun, quần tây, sơ mi chất lượng cao.
Hãy trả lời khách hàng bằng tiếng Việt một cách lịch sự, nhiệt tình nhưng ngắn gọn và có cấu trúc rõ ràng.

Dưới đây là thông tin CHÍNH XÁC từ cửa hàng VelvetStore. Bạn CHỈ ĐƯỢC dùng thông tin này để tư vấn khách hàng:

1. DANH SÁCH SẢN PHẨM ĐANG BÁN:
${productsContext || 'Hiện đang cập nhật sản phẩm'}

2. DANH SÁCH MÃ GIẢM GIÁ ĐANG HOẠT ĐỘNG:
${vouchersContext || 'Hiện không có mã giảm giá nào'}

3. CHÍNH SÁCH CỦA VELVETSTORE:
- Giao hàng: Miễn phí vận chuyển cho đơn hàng từ 500,000đ. Đơn nội thành giao trong 1-2 ngày, ngoại thành từ 3-5 ngày.
- Đổi trả: Hỗ trợ đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu còn nguyên tem mác, chưa qua sử dụng.
- Bảo hành: Bảo hành đường may, khóa kéo trong vòng 30 ngày.

4. LIÊN HỆ CỬA HÀNG:
- Hotline hỗ trợ: 090 123 4567 (Hoạt động từ 8:00 đến 22:00 hàng ngày).
- Địa chỉ: 123 Đường Ba Tháng Hai, Phường 11, Quận 10, TP. Hồ Chí Minh.
- Email: hotro@velvetstore.vn

NHIỆM VỤ CỦA BẠN:
- Nếu khách hàng muốn tìm sản phẩm hoặc hỏi về các mẫu quần áo, hãy kể tên các sản phẩm cụ thể từ danh sách trên kèm giá bán. 
- Nếu khách hàng xin mã giảm giá, hãy cung cấp chính xác các mã giảm giá ở trên.
- Bạn tuyệt đối KHÔNG ĐƯỢC tự bịa ra thông tin sản phẩm hoặc mã giảm giá mới không có trong danh sách.
- Trả lời ngắn gọn dưới 3-4 câu, phân dòng rõ ràng cho dễ đọc.
`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${systemPrompt}\n\nKhách hàng hỏi: "${message}"\n\nTrợ lý trả lời:`
                }]
              }]
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            let attachedProducts = [];
            let attachedVouchers = [];

            activeProducts.forEach(p => {
              if (cleanMessage.includes(p.name.toLowerCase()) || replyText.toLowerCase().includes(p.name.toLowerCase())) {
                attachedProducts.push(p);
              }
            });

            activeVouchers.forEach(v => {
              if (cleanMessage.includes(v.code.toLowerCase()) || replyText.toLowerCase().includes(v.code.toLowerCase())) {
                attachedVouchers.push(v);
              }
            });

            if (attachedProducts.length === 0 && (cleanNoAccent.includes('san pham') || cleanNoAccent.includes('tim ao') || cleanNoAccent.includes('quan'))) {
              attachedProducts = activeProducts.slice(0, 3);
            }

            if (attachedVouchers.length === 0 && (cleanNoAccent.includes('voucher') || cleanNoAccent.includes('giam gia') || cleanNoAccent.includes('khuyen mai'))) {
              attachedVouchers = activeVouchers.slice(0, 3);
            }

            return res.json({
              reply: replyText.trim(),
              type: attachedProducts.length > 0 ? 'products' : (attachedVouchers.length > 0 ? 'vouchers' : 'text'),
              products: attachedProducts.slice(0, 4),
              vouchers: attachedVouchers.slice(0, 4)
            });
          }
        }
      } catch (geminiError) {
        console.error('Lỗi khi gọi API Gemini, chuyển hướng sang Local Fallback Engine:', geminiError);
      }
    }

    // 3. ENGINE 2: LOCAL SMART DB SEARCH ENGINE (Fallback tự động - Hoạt động Offline)

    // A. Tư vấn chọn size sản phẩm
    if (cleanNoAccent.includes('size') || cleanNoAccent.includes('kich co') || cleanNoAccent.includes('kich thuoc') || cleanNoAccent.includes('mac vua')) {
      return res.json({
        reply: `👕 **Hướng dẫn chọn Size tại VelvetStore:**\n\nChúng mình có đầy đủ các size thông dụng từ **S đến XL**:\n• **Size S:** Dưới 52kg (Nữ) / Dưới 60kg (Nam)\n• **Size M:** 52kg - 58kg (Nữ) / 60kg - 68kg (Nam)\n• **Size L:** 58kg - 65kg (Nữ) / 68kg - 76kg (Nam)\n• **Size XL:** Trên 65kg (Nữ) / Trên 76kg (Nam)\n\n*Mỗi dòng sản phẩm sẽ có phom dáng Regular hay Slimfit khác nhau. Bạn có thể cung cấp chiều cao + cân nặng cụ thể để mình hỗ trợ tư vấn chi tiết hơn nhé!*`,
        type: 'text'
      });
    }

    // B. Tư vấn chất liệu vải
    if (cleanNoAccent.includes('chat lieu') || cleanNoAccent.includes('vai gi') || cleanNoAccent.includes('vai cotton') || cleanNoAccent.includes('co mat khong')) {
      return res.json({
        reply: `🌿 **Chất liệu vải cao cấp tại VelvetStore:**\n\nVelvetStore luôn đặt chất lượng sản phẩm lên hàng đầu. Các mẫu trang phục được may từ chất liệu tuyển chọn kỹ lưỡng:\n• **100% Cotton Organic:** Mềm mại, thấm hút mồ hôi siêu tốt, cực kỳ thoáng mát cho da.\n• **Vải Cotton Cá Sấu (Pique):** Phom dáng polo đứng đắn, bền màu, không xơ xước.\n• **Vải Lụa Satin & Tuyết Mưa:** Mềm mại, thướt tha rất sang trọng dành riêng cho váy đầm thiết kế.\n\n*Tất cả sản phẩm đều được kiểm tra kỹ đường may trước khi giao đến tay bạn.*`,
        type: 'text'
      });
    }

    // C. Tư vấn phương thức thanh toán & Cách thức mua hàng
    if (cleanNoAccent.includes('thanh toan') || cleanNoAccent.includes('mua hang') || cleanNoAccent.includes('chuyen khoan') || cleanNoAccent.includes('cod') || cleanNoAccent.includes('vnpay')) {
      return res.json({
        reply: `💳 **Phương thức mua hàng & Thanh toán tại VelvetStore:**\n\nBạn có thể dễ dàng đặt hàng online qua website và chọn các hình thức thanh toán linh hoạt:\n1. 💵 **Thanh toán COD:** Nhận hàng, kiểm tra sản phẩm rồi mới trả tiền mặt cho shipper.\n2. 💳 **Thanh toán trực tuyến qua cổng VNPay:** Chuyển khoản an toàn, nhanh chóng và nhận nhiều khuyến mãi đi kèm.\n\n*Để mua hàng, bạn chỉ cần click vào sản phẩm yêu thích, chọn size + màu, bấm "Thêm vào giỏ hàng" và tiến hành "Thanh toán" tại trang giỏ hàng nhé!*`,
        type: 'text'
      });
    }

    // D. Hướng dẫn kiểm tra/tra cứu đơn hàng
    if (cleanNoAccent.includes('don hang') || cleanNoAccent.includes('tra cuu don') || cleanNoAccent.includes('lich su don') || cleanNoAccent.includes('khi nao nhan')) {
      return res.json({
        reply: `📦 **Tra cứu trạng thái Đơn hàng:**\n\nBạn có thể dễ dàng tra cứu hành trình đơn hàng của mình theo cách sau:\n1. Bấm vào biểu tượng tài khoản ở góc trên màn hình.\n2. Chọn mục **"Đơn hàng của tôi"**.\n3. Tại đây sẽ hiển thị chi tiết các đơn hàng bạn đã đặt cùng trạng thái tương ứng (Chờ xác nhận, Đang giao, Đã giao...).\n\n*Nếu cần hỗ trợ gấp về đơn hàng, bạn vui lòng nhắn Hotline 090 123 4567 kèm mã đơn để được giải quyết nhanh nhất.*`,
        type: 'text'
      });
    }

    // E. Người dùng hỏi về chính sách giao hàng, vận chuyển, đổi trả, bảo hành
    const isAskingPolicy = cleanNoAccent.includes('ship') || 
                           cleanNoAccent.includes('giao hang') || 
                           cleanNoAccent.includes('doi tra') || 
                           cleanNoAccent.includes('bao hanh') || 
                           cleanNoAccent.includes('van chuyen') || 
                           cleanNoAccent.includes('nhan hang') ||
                           cleanNoAccent.includes('phi') ||
                           cleanNoAccent.includes('cuoc') ||
                           cleanNoAccent.includes('chinh sach');

    if (isAskingPolicy) {
      return res.json({
        reply: `🚚 **Chính sách giao hàng & Đổi trả tại VelvetStore:**\n\n• **Vận chuyển:** Miễn phí giao hàng toàn quốc cho hóa đơn từ **500,000đ** trở lên. Đơn dưới 500k phí ship đồng giá 30k. Thời gian nhận hàng từ 1-3 ngày.\n• **Đổi trả:** Hỗ trợ đổi size hoặc mẫu trong vòng **7 ngày** kể từ ngày nhận hàng (sản phẩm phải còn nguyên mác, chưa giặt ủi).\n• **Bảo hành:** Cam kết hỗ trợ sửa chữa khuy áo, khóa kéo và đường may miễn phí trọn đời trong vòng **30 ngày**.`,
        type: 'text'
      });
    }

    // F. Người dùng hỏi địa chỉ, liên hệ, số điện thoại
    const isAskingContact = cleanNoAccent.includes('dia chi') || 
                            cleanNoAccent.includes('lien he') || 
                            cleanNoAccent.includes('sdt') || 
                            cleanNoAccent.includes('so dien thoai') || 
                            cleanNoAccent.includes('cua hang') || 
                            cleanNoAccent.includes('email') || 
                            cleanNoAccent.includes('o dau') || 
                            cleanNoAccent.includes('hotline');

    if (isAskingContact) {
      return res.json({
        reply: `📍 **Thông tin liên hệ VelvetStore:**\n\n• **Cửa hàng:** 123 Đường Ba Tháng Hai, Phường 11, Quận 10, TP. Hồ Chí Minh.\n• **Hotline:** 090 123 4567 (Hỗ trợ từ 8:00 đến 22:00 hàng ngày).\n• **Email:** hotro@velvetstore.vn\n• **Facebook:** [VelvetStore Fashion](https://facebook.com)\n\n*Chúng mình rất hân hạnh được chào đón bạn ghé thử đồ trực tiếp tại shop!*`,
        type: 'text'
      });
    }

    // G. Người dùng hỏi về mã giảm giá (voucher, discount, mã giảm...)
    const isAskingVouchers = cleanNoAccent.includes('voucher') || 
                             cleanNoAccent.includes('giam gia') || 
                             cleanNoAccent.includes('khuyen mai') || 
                             cleanNoAccent.includes('ma giam') ||
                             cleanNoAccent.includes('uu dai') ||
                             cleanNoAccent.includes('code');

    if (isAskingVouchers) {
      if (activeVouchers.length === 0) {
        return res.json({
          reply: 'Hiện tại VelvetStore chưa áp dụng mã giảm giá mới. Bạn vui lòng theo dõi thêm trang chủ hoặc fanpage của chúng mình để nhận ưu đãi sớm nhất nhé!',
          type: 'text'
        });
      }

      return res.json({
        reply: 'VelvetStore đang áp dụng các chương trình khuyến mãi cực ưu đãi dưới đây! Bạn nhấp vào mã giảm giá để sao chép nhanh nhé:',
        type: 'vouchers',
        vouchers: activeVouchers.slice(0, 4)
      });
    }

    // H. Người dùng hỏi về sản phẩm (áo, quần, đầm, váy, tìm kiếm sản phẩm...)
    const isAskingProducts = cleanNoAccent.includes('ao') || 
                             cleanNoAccent.includes('quan') || 
                             cleanNoAccent.includes('vay') || 
                             cleanNoAccent.includes('dam') || 
                             cleanNoAccent.includes('tim') || 
                             cleanNoAccent.includes('san pham') || 
                             cleanNoAccent.includes('co gi') ||
                             cleanNoAccent.includes('ban gi') ||
                             cleanNoAccent.includes('mua') ||
                             cleanNoAccent.includes('dep') ||
                             cleanNoAccent.includes('hot') ||
                             cleanNoAccent.includes('gia');

    if (isAskingProducts) {
      const searchKeywords = message
        .replace(/(tìm kiếm|tìm|cần mua|mua|sản phẩm|có|không|bán| VelvetStore| Velvet|áo|quần|váy|đầm|cửa hàng)/gi, '')
        .trim();

      let matchedProducts = [];
      if (searchKeywords.length > 1) {
        matchedProducts = await Product.findAll({
          where: {
            isActive: true,
            [Op.or]: [
              { name: { [Op.like]: `%${searchKeywords}%` } },
              { description: { [Op.like]: `%${searchKeywords}%` } }
            ]
          },
          include: [{ model: ProductImage, as: 'images', where: { isPrimary: true }, required: false }],
          limit: 4
        });
      }

      if (matchedProducts.length === 0) {
        matchedProducts = activeProducts.slice(0, 4);
        return res.json({
          reply: 'VelvetStore có các mẫu thời trang váy đầm thiết kế, áo thun cá tính và quần tây cao cấp cực đẹp. Dưới đây là một số sản phẩm nổi bật đang bán chạy nhất tại shop:',
          type: 'products',
          products: matchedProducts
        });
      }

      return res.json({
        reply: `Dưới đây là các mẫu thời trang phù hợp với từ khóa "${searchKeywords}" mà mình tìm thấy tại cửa hàng cho bạn:`,
        type: 'products',
        products: matchedProducts
      });
    }

    // I. Chào hỏi thân thiện (Dùng RegExp ranh giới từ để tránh trùng các từ Tiếng Việt ghép chứa "hi" như "chính", "chỉ", "khi"...)
    const greetings = [/\bhello\b/i, /\bhi\b/i, /\bxin chao\b/i, /\bchao ban\b/i, /\bchao em\b/i, /\balo\b/i, /\bchao admin\b/i, /\bhey\b/i, /\bchao\b/i];
    const isGreeting = greetings.some(regex => regex.test(cleanNoAccent));

    if (isGreeting) {
      return res.json({
        reply: 'Xin chào! Mình là Trợ lý ảo VelvetStore. Mình luôn sẵn sàng tư vấn mẫu quần áo, thông tin khuyến mãi và chính sách giao hàng của shop. Bạn cần mình giúp gì hôm nay?',
        type: 'text'
      });
    }

    // Phản hồi mặc định phong phú
    return res.json({
      reply: `Cảm ơn bạn đã nhắn tin cho VelvetStore! Mình chưa hiểu rõ câu hỏi này lắm.\n\nBạn có thể thử hỏi các câu hỏi như:\n• *"Cửa hàng bán áo gì?"*\n• *"Có mã giảm giá nào không?"*\n• *"Shop ở đâu?"*\n• *"Tư vấn chọn size"* hoặc *"Chất liệu vải"* nhé!`,
      type: 'text'
    });

  } catch (error) {
    console.error('Lỗi hệ thống Chatbot:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý tin nhắn của bạn' });
  }
};

module.exports = {
  queryChatbot
};
