require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Product, ProductImage, ProductVariant, Review, Voucher, Blog, ShippingMethod, SystemConfig } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối database thành công');

    await sequelize.sync({ force: true });
    console.log('Đã xóa và tạo lại các bảng dữ liệu');

    // --- 1. NGƯỜI DÙNG (USERS) ---
    // Mật khẩu mẫu chung là "123456", admin là "admin123"
    const hashedPassword = await bcrypt.hash('123456', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin = await User.create({
      fullName: 'Quản trị viên VelvetStore',
      email: 'admin@velvetstore.vn',
      password: adminPassword,
      phone: '0901234567',
      role: 'admin',
      isActive: true
    }, { hooks: false });

    const customers = [
      { fullName: 'Đặng Minh Khôi', email: 'khoi@gmail.com', password: hashedPassword, phone: '0912345678', role: 'customer', isActive: true },
      { fullName: 'Lê Phương Thảo', email: 'thao@gmail.com', password: hashedPassword, phone: '0923456789', role: 'customer', isActive: true },
      { fullName: 'Nguyễn Tiến Đạt', email: 'dat@gmail.com', password: hashedPassword, phone: '0934567890', role: 'customer', isActive: true },
      { fullName: 'Trần Quỳnh Chi', email: 'chi@gmail.com', password: hashedPassword, phone: '0945678901', role: 'customer', isActive: true },
      { fullName: 'Phạm Gia Bảo', email: 'bao@gmail.com', password: hashedPassword, phone: '0956789012', role: 'customer', isActive: true },
      { fullName: 'Hoàng Trúc Linh', email: 'linh@gmail.com', password: hashedPassword, phone: '0967890123', role: 'customer', isActive: true }
    ];

    const createdCustomers = [];
    for (const c of customers) {
      const u = await User.create(c, { hooks: false });
      createdCustomers.push(u);
    }
    console.log(`Đã tạo thành công ${createdCustomers.length} người dùng thật (Không chứa ký tự generic A, B, C...)`);

    // --- 2. DANH MỤC SẢN PHẨM (CATEGORIES) ---
    const catAo = await Category.create({ name: 'Áo', slug: 'ao', description: 'Các loại áo thời trang nam nữ', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', isActive: true });
    const catQuan = await Category.create({ name: 'Quần', slug: 'quan', description: 'Quần jeans, kaki, shorts thời trang', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', isActive: true });
    const catVay = await Category.create({ name: 'Váy', slug: 'vay', description: 'Váy đầm nữ đa phong cách', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', isActive: true });
    const catPhuKien = await Category.create({ name: 'Phụ kiện', slug: 'phu-kien', description: 'Túi xách, mũ nón, thắt lưng', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400', isActive: true });

    // Các danh mục con (Sub-categories)
    const catAoThun = await Category.create({ name: 'Áo thun', slug: 'ao-thun', description: 'Áo thun nam nữ chất cotton thoáng mát', parentId: catAo.id, isActive: true });
    const catAoSoMi = await Category.create({ name: 'Áo sơ mi', slug: 'ao-so-mi', description: 'Áo sơ mi công sở lịch lãm', parentId: catAo.id, isActive: true });
    const catAoKhoac = await Category.create({ name: 'Áo khoác', slug: 'ao-khoac', description: 'Áo khoác gió, blazer, hoodie', parentId: catAo.id, isActive: true });
    const catQuanJean = await Category.create({ name: 'Quần jean', slug: 'quan-jean', description: 'Quần jean denim co giãn thời thượng', parentId: catQuan.id, isActive: true });
    const catQuanKaki = await Category.create({ name: 'Quần kaki', slug: 'quan-kaki', description: 'Quần kaki công sở dáng đứng', parentId: catQuan.id, isActive: true });

    console.log('Đã tạo danh mục thời trang thành công');

    // --- 3. SẢN PHẨM & BIẾN THỂ (PRODUCTS & VARIANTS) ---
    const products = [
      {
        name: 'Áo thun cổ tròn Basic cotton organic',
        slug: 'ao-thun-co-tron-basic-cotton-organic',
        description: 'Áo thun cổ tròn làm từ 100% cotton organic siêu mềm mịn, thấm hút tốt và thân thiện với làn da. Thiết kế basic dễ dàng phối cùng quần jean hay kaki để tạo nên vẻ năng động hàng ngày.',
        price: 250000,
        salePrice: 199000,
        categoryId: catAoThun.id,
        material: 'Cotton Organic 100%',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600', isPrimary: false }
        ],
        variants: [
          { size: 'M', color: 'Trắng', stock: 45 },
          { size: 'L', color: 'Trắng', stock: 60 },
          { size: 'XL', color: 'Trắng', stock: 30 },
          { size: 'M', color: 'Đen', stock: 50 },
          { size: 'L', color: 'Đen', stock: 75 }
        ]
      },
      {
        name: 'Áo sơ mi Oxford dài tay phong cách Hàn Quốc',
        slug: 'ao-so-mi-oxford-dai-tay-han-quoc',
        description: 'Áo sơ mi Oxford cao cấp thiết kế phom dáng Slim-fit vừa vặn, chỉn chu tinh tế. Chất liệu Oxford cotton dầy dặn dệt vân tinh sảo, giữ phom tốt sau nhiều lần giặt. Thích hợp đi làm, đi dự tiệc.',
        price: 450000,
        salePrice: 389000,
        categoryId: catAoSoMi.id,
        material: 'Oxford Cotton',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=600', isPrimary: false }
        ],
        variants: [
          { size: 'M', color: 'Trắng', stock: 35 },
          { size: 'L', color: 'Trắng', stock: 40 },
          { size: 'XL', color: 'Trắng', stock: 20 },
          { size: 'M', color: 'Xanh nhạt', stock: 25 },
          { size: 'L', color: 'Xanh nhạt', stock: 30 }
        ]
      },
      {
        name: 'Áo khoác Bomber năng động chống gió nhẹ',
        slug: 'ao-khoac-bomber-chong-gio-nhe',
        description: 'Áo khoác bomber phong cách streetwear năng động cá tính. Lớp vải dù dù polyester cao cấp chống thấm gió nước nhẹ, lót lụa mềm mịn mát lạnh bên trong mang lại sự thoải mái tuyệt hảo.',
        price: 680000,
        salePrice: 550000,
        categoryId: catAoKhoac.id,
        material: 'Polyester chống nước nhẹ',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=600', isPrimary: false }
        ],
        variants: [
          { size: 'M', color: 'Đen', stock: 20 },
          { size: 'L', color: 'Đen', stock: 30 },
          { size: 'XL', color: 'Đen', stock: 15 },
          { size: 'M', color: 'Xanh rêu', stock: 15 },
          { size: 'L', color: 'Xanh rêu', stock: 20 }
        ]
      },
      {
        name: 'Quần jean nam Slim-fit co giãn năng động',
        slug: 'quan-jean-nam-slim-fit-co-gian',
        description: 'Quần jean nam phom dáng slim-fit ôm nhẹ cực tôn dáng. Chất vải denim dày dặn pha thun spandex co giãn thoải mái khi di chuyển dạo phố. Màu chàm wash nhẹ hiện đại trẻ trung.',
        price: 550000,
        salePrice: 450000,
        categoryId: catQuanJean.id,
        material: 'Denim co giãn cao cấp',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', isPrimary: false }
        ],
        variants: [
          { size: '29', color: 'Xanh đậm', stock: 25 },
          { size: '30', color: 'Xanh đậm', stock: 40 },
          { size: '31', color: 'Xanh đậm', stock: 30 },
          { size: '30', color: 'Xanh nhạt', stock: 20 },
          { size: '31', color: 'Xanh nhạt', stock: 25 }
        ]
      },
      {
        name: 'Quần kaki baggy unisex phom rộng Hàn Quốc',
        slug: 'quan-kaki-baggy-unisex-phom-rong',
        description: 'Quần kaki dáng baggy phom rộng cực kỳ cá tính thoải mái. Phong cách tối giản Hàn Quốc năng động, dễ dàng diện cùng áo thun hay sơ mi oversize phù hợp cho cả nam lẫn nữ.',
        price: 420000,
        salePrice: 350000,
        categoryId: catQuanKaki.id,
        material: 'Kaki Cotton dày mịn',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600', isPrimary: true }
        ],
        variants: [
          { size: '29', color: 'Be', stock: 35 },
          { size: '30', color: 'Be', stock: 50 },
          { size: '31', color: 'Be', stock: 40 },
          { size: '30', color: 'Đen', stock: 30 }
        ]
      },
      {
        name: 'Váy liền hoa nhí dáng xòe Vintage nhẹ nhàng',
        slug: 'vay-lien-hoa-nhi-dang-xoe-vintage',
        description: 'Váy liền họa tiết hoa nhí cổ điển ngọt ngào quyến rũ. Dáng váy xòe chữ A uyển chuyển bồng bềnh làm từ vải voan Hàn Quốc nhẹ mát như sương, phù hợp đi chụp ảnh kỷ niệm, dạo chơi cuối tuần.',
        price: 520000,
        salePrice: 429000,
        categoryId: catVay.id,
        material: 'Voan tơ lụa Hàn Quốc',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', isPrimary: false }
        ],
        variants: [
          { size: 'S', color: 'Hồng', stock: 15 },
          { size: 'M', color: 'Hồng', stock: 25 },
          { size: 'L', color: 'Hồng', stock: 20 },
          { size: 'S', color: 'Xanh', stock: 10 },
          { size: 'M', color: 'Xanh', stock: 15 }
        ]
      },
      {
        name: 'Áo thun Polo thể thao nam cotton pique',
        slug: 'ao-thun-polo-the-thao-nam-cotton',
        description: 'Áo thun polo nam cổ bẻ dệt bo sang trọng. Chất liệu vải cá sấu Cotton Pique đan mắt dệt tổ ong thoáng khí tuyệt vời, co giãn nhẹ và bền phom. Tạo điểm nhấn lịch sự đĩnh đạc.',
        price: 350000,
        salePrice: 299000,
        categoryId: catAoThun.id,
        material: 'Cotton Pique thoáng khí',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'M', color: 'Xanh navy', stock: 35 },
          { size: 'L', color: 'Xanh navy', stock: 45 },
          { size: 'XL', color: 'Xanh navy', stock: 20 },
          { size: 'M', color: 'Trắng', stock: 25 },
          { size: 'L', color: 'Trắng', stock: 30 }
        ]
      },
      {
        name: 'Túi tote vải Canvas thời trang in chữ nghệ thuật',
        slug: 'tui-tote-vai-canvas-art',
        description: 'Túi tote may thủ công tinh tế bằng chất vải bố canvas siêu bền dày dặn. Bản in chữ họa tiết nghệ thuật tối giản, ngăn chứa rộng đựng vừa vặn laptop 14 inch, tài liệu đi học tiện lợi.',
        price: 180000,
        salePrice: 139000,
        categoryId: catPhuKien.id,
        material: 'Vải bố Canvas tự nhiên',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'Free size', color: 'Be', stock: 100 },
          { size: 'Free size', color: 'Đen', stock: 80 }
        ]
      },
      {
        name: 'Áo khoác Blazer nữ phom rộng thanh lịch công sở',
        slug: 'ao-khoac-blazer-nu-phom-rong',
        description: 'Áo khoác Blazer nữ thiết kế phom rộng phong cách hiện đại với đệm vai thanh thoát lịch sự. Vải tuyết mưa dầy dặn cao cấp, lót lụa mềm mát bên trong giúp tôn lên nét thanh lịch của phái nữ.',
        price: 750000,
        salePrice: 599000,
        categoryId: catAoKhoac.id,
        material: 'Tuyết mưa cao cấp có lót lụa',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'S', color: 'Đen', stock: 15 },
          { size: 'M', color: 'Đen', stock: 25 },
          { size: 'L', color: 'Đen', stock: 20 },
          { size: 'S', color: 'Be', stock: 10 },
          { size: 'M', color: 'Be', stock: 15 }
        ]
      },
      {
        name: 'Quần Tây Âu nam lịch lãm cao cấp',
        slug: 'quan-tay-au-nam-lich-lam-cao-cap',
        description: 'Quần tây nam thiết kế phom dáng Slim-fit thời thượng lịch lãm. Vải tây tuyết có độ co giãn nhẹ nhàng, chống nhăn cực tốt và giữ nếp ly sắc nét sau nhiều lần giặt. Rất thích hợp diện cùng sơ mi.',
        price: 490000,
        salePrice: 399000,
        categoryId: catQuanKaki.id,
        material: 'Vải tây co giãn chống nhăn',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600', isPrimary: true }
        ],
        variants: [
          { size: '29', color: 'Xám', stock: 20 },
          { size: '30', color: 'Xám', stock: 35 },
          { size: '31', color: 'Xám', stock: 30 },
          { size: '30', color: 'Đen', stock: 25 }
        ]
      },
      {
        name: 'Đầm lụa Satin ôm nhẹ quyến rũ thời thượng',
        slug: 'dam-lua-satin-om-nhe-quyen-ru',
        description: 'Đầm lụa trơn Satin cắt may thủ công cao cấp tạo hiệu ứng bóng mượt rủ mềm óng ả theo từng bước chân. Thiết kế cổ đổ nhẹ quyến rũ kiêu sa nâng tầm đẳng cấp trong các buổi dạ tiệc dạ hội.',
        price: 850000,
        salePrice: 699000,
        categoryId: catVay.id,
        material: 'Lụa Satin mịn mượt cao cấp',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'S', color: 'Hồng cánh sen', stock: 10 },
          { size: 'M', color: 'Hồng cánh sen', stock: 15 },
          { size: 'S', color: 'Xanh cổ vịt', stock: 8 },
          { size: 'M', color: 'Xanh cổ vịt', stock: 12 }
        ]
      },
      {
        name: 'Mũ lưỡi trai nhung tăm Retro phong cách Hàn Quốc',
        slug: 'mu-luoi-trai-nhung-tam-retro',
        description: 'Mũ lưỡi trai phong cách retro cổ điển cá tính được làm bằng chất liệu nhung tăm tơi xốp siêu mềm mịn. Form nón ôm đầu cực đẹp, có khóa điều chỉnh nấc cài tiện lợi, thích hợp cho cả nam và nữ.',
        price: 199000,
        salePrice: 150000,
        categoryId: catPhuKien.id,
        material: 'Nhung tăm dệt dày dặn',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'Free size', color: 'Vàng mù tạt', stock: 50 },
          { size: 'Free size', color: 'Đen', stock: 60 }
        ]
      },
      {
        name: 'Áo croptop thun gân nữ quyến rũ thời thượng',
        slug: 'ao-croptop-thun-gan-nu-quyen-ru',
        description: 'Áo croptop thun gân cotton mỏng nhẹ ôm sát vòng một đầy quyến rũ dạo phố. Vải thun gân tăm co giãn đàn hồi tốt mang lại sự dễ chịu năng động khi vận động tập gym hay dã ngoại.',
        price: 180000,
        salePrice: 129000,
        categoryId: catAoThun.id,
        material: 'Thun gân tăm co giãn 4 chiều',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'S', color: 'Vàng nhạt', stock: 20 },
          { size: 'M', color: 'Vàng nhạt', stock: 30 },
          { size: 'S', color: 'Đen', stock: 25 },
          { size: 'M', color: 'Đen', stock: 35 }
        ]
      },
      {
        name: 'Thắt lưng nam da bò thật khóa kim loại',
        slug: 'that-lung-nam-da-bo-that',
        description: 'Thắt lưng nam được làm từ 100% da bò nguyên tấm bóng mịn cực sang trọng dẻo dai. Thiết kế đầu khóa hợp kim màu bạc chống trầy xước tinh tế mang lại điểm nhấn chỉn chu lịch thiệp.',
        price: 350000,
        salePrice: 280000,
        categoryId: catPhuKien.id,
        material: 'Da bò thật 100% nguyên tấm',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'Free size', color: 'Đen', stock: 40 },
          { size: 'Free size', color: 'Nâu cà phê', stock: 30 }
        ]
      },
      {
        name: 'Áo sơ mi lụa cổ V thanh lịch duyên dáng',
        slug: 'ao-so-mi-lua-co-v-thanh-lich',
        description: 'Áo sơ mi lụa tơ nhân tạo mềm mại thiết kế cổ chữ V thanh lịch duyên dáng. Chất lụa mướt rủ không nhăn đem lại cảm giác tự nhiên nhẹ nhàng, vừa kín đáo nhã nhặn công sở vừa phóng khoáng đi dạo phố.',
        price: 480000,
        salePrice: 399000,
        categoryId: catAoSoMi.id,
        material: 'Lụa tơ nhân tạo mềm rủ',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'S', color: 'Xanh lục bảo', stock: 15 },
          { size: 'M', color: 'Xanh lục bảo', stock: 20 },
          { size: 'S', color: 'Trắng sữa', stock: 18 },
          { size: 'M', color: 'Trắng sữa', stock: 22 }
        ]
      },
      {
        name: 'Quần jean đen rách gối bụi bặm phong cách',
        slug: 'quan-jean-den-rach-goi-bui-bam',
        description: 'Quần jean đen chất denim dầy dặn cá tính kết hợp các vết cào nhẹ và rách gối khéo léo bụi bặm. Phom dáng slim tôn hình thể khoẻ khoắn đầy bụi bặm phong cách phóng khoáng dạo phố cho phái nam.',
        price: 580000,
        salePrice: 480000,
        categoryId: catQuanJean.id,
        material: 'Denim bò co giãn cứng cáp',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1511105612662-2cd9ad9fd0d5?w=600', isPrimary: true }
        ],
        variants: [
          { size: '29', color: 'Đen', stock: 15 },
          { size: '30', color: 'Đen', stock: 30 },
          { size: '31', color: 'Đen', stock: 25 },
          { size: '32', color: 'Đen', stock: 15 }
        ]
      },
      {
        name: 'Hoodie nỉ bông dày dặn phom rộng unisex',
        slug: 'hoodie-ni-bong-day-dan-unisex',
        description: 'Áo khoác hoodie nỉ chui đầu phom dáng rộng Hàn Quốc siêu đáng yêu ấm áp. Lớp nỉ lót bông mịn màng giữ nhiệt cản gió cực tốt phù hợp mặc cặp đôi hay làm áo khoác nhẹ dã ngoại dạo phố mùa đông.',
        price: 480000,
        salePrice: 389000,
        categoryId: catAoKhoac.id,
        material: 'Nỉ bông lót bông mịn',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'M', color: 'Đen', stock: 25 },
          { size: 'L', color: 'Đen', stock: 30 },
          { size: 'M', color: 'Xám chuột', stock: 20 },
          { size: 'L', color: 'Xám chuột', stock: 25 }
        ]
      },
      {
        name: 'Váy xếp ly dáng lửng Midi thanh lịch công sở',
        slug: 'vay-xep-ly-dang-lung-midi',
        description: 'Chân váy lửng Midi xếp ly nhuyễn tinh tế, chất vải thun cát dầy mịn rủ tự nhiên che khuyết điểm rất tôn dáng thon thả. Thiết kế lưng chun co giãn nhẹ thoải mái phù hợp làm việc công sở, hội họp.',
        price: 460000,
        salePrice: null,
        categoryId: catVay.id,
        material: 'Vải cát Hàn Quốc dày mịn',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'S', color: 'Đen tuyền', stock: 15 },
          { size: 'M', color: 'Đen tuyền', stock: 25 },
          { size: 'S', color: 'Nâu be', stock: 12 },
          { size: 'M', color: 'Nâu be', stock: 18 }
        ]
      },
      {
        name: 'Áo sơ mi vải Linen tự nhiên ngắn tay bay bổng',
        slug: 'ao-so-mi-linen-ngan-tay-bay-bong',
        description: 'Áo sơ mi nam làm bằng chất liệu sợi lanh Linen dệt mở thoáng mát bay bổng, thâm hút cực đỉnh phù hợp các chuyến đi biển dạo mát nghỉ hè. Phom dáng Relaxed-fit tự nhiên thanh tao mát mẻ.',
        price: 380000,
        salePrice: 319000,
        categoryId: catAoSoMi.id,
        material: 'Linen tự nhiên 100%',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'M', color: 'Trắng tinh', stock: 20 },
          { size: 'L', color: 'Trắng tinh', stock: 25 },
          { size: 'M', color: 'Xanh nhạt', stock: 15 },
          { size: 'L', color: 'Xanh nhạt', stock: 18 }
        ]
      },
      {
        name: 'Quần shorts thun nỉ nam năng động thoải mái',
        slug: 'quan-shorts-thun-ni-nam',
        description: 'Quần shorts nỉ cotton co giãn nhẹ phom trên gối, dây thun rút lưng dễ chịu năng động tuyệt hảo tập thể thao dã ngoại hoặc thư giãn thoải mái mát mẻ tại nhà dịp nghỉ hè nóng nực.',
        price: 280000,
        salePrice: 219000,
        categoryId: catQuanJean.id, // Put under jean/pants category
        material: 'Nỉ cotton tổ ong thoáng mát',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'M', color: 'Đen', stock: 35 },
          { size: 'L', color: 'Đen', stock: 40 },
          { size: 'XL', color: 'Đen', stock: 20 },
          { size: 'M', color: 'Xám', stock: 25 }
        ]
      }
    ];

    for (const p of products) {
      const product = await Product.create({
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice,
        categoryId: p.categoryId,
        material: p.material,
        brand: p.brand,
        isFeatured: p.isFeatured,
        totalSold: Math.floor(10 + Math.random() * 90),
        avgRating: (4.0 + Math.random() * 1.0).toFixed(1)
      });

      for (const img of p.images) {
        await ProductImage.create({
          productId: product.id,
          url: img.url,
          isPrimary: img.isPrimary,
          sortOrder: img.isPrimary ? 0 : 1
        });
      }

      for (const v of p.variants) {
        await ProductVariant.create({
          productId: product.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
          sku: `${p.slug.substring(0, 6).toUpperCase()}-${v.size}-${v.color.substring(0, 2).toUpperCase()}`
        });
      }
    }
    console.log(`Đã tạo thành công ${products.length} sản phẩm cao cấp cùng các biến thể phân loại màu/size hoàn chỉnh`);

    // --- 4. ĐÁNH GIÁ (REVIEWS) ---
    const allProducts = await Product.findAll();
    const reviewData = [
      { rating: 5, comment: 'Chất vải siêu dày mịn mát lịm, mặc thoáng thoải mái, đi chơi hay đi làm đều sang. Giao hàng cực nhanh!' },
      { rating: 5, comment: 'Đã nhận được hàng đúng như mô tả. Đóng hộp lịch sự sang xịn mịn, chất lượng thêu đường may cực kỳ sắc sảo tỉ mỉ.' },
      { rating: 4, comment: 'Sản phẩm đẹp vừa vặn dáng mình lắm. Giao hàng nhanh đóng gói kỹ càng, tuy nhiên màu thực tế sáng hơn hình một chút.' },
      { rating: 5, comment: 'Không có điểm gì chê luôn á. Chất vải bền bỉ mặc giặt không bị xù lông phai màu tý nào, sẽ còn quay lại ủng hộ tiếp!' },
      { rating: 4, comment: 'Vải rất ưng ý sờ mướt mát mịn màng. Thiết kế tinh tế trẻ trung sang trọng lắm, nhân viên tư vấn siêu dễ thương nhiệt tình.' },
      { rating: 5, comment: 'Phom áo rất đẹp tôn dáng tôn da cực đỉnh, shop giao hàng rất tốc độ đóng gói kĩ. Rất đáng tiền!' },
      { rating: 5, comment: 'Mình mua tặng người yêu mà anh ấy khen quá trời luôn. Chất vải mịn màng đường kim mũi chỉ chắc chắn xịn lắm nha!' }
    ];

    let reviewIndex = 0;
    for (const prod of allProducts) {
      // Mỗi sản phẩm có từ 2 đến 4 review ngẫu nhiên từ khách hàng thật
      const numReviews = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numReviews; i++) {
        const rv = reviewData[reviewIndex % reviewData.length];
        const randomCustomer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
        
        await Review.create({
          userId: randomCustomer.id,
          productId: prod.id,
          rating: rv.rating,
          comment: rv.comment,
          isVisible: true
        });
        reviewIndex++;
      }

      const reviews = await Review.findAll({ where: { productId: prod.id, isVisible: true } });
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await prod.update({ avgRating: avg.toFixed(1) });
    }
    console.log(`Đã tạo thành công đánh giá chất lượng sản phẩm chân thực từ khách hàng thật`);

    // --- 5. MÃ GIẢM GIÁ (VOUCHERS) ---
    await Voucher.bulkCreate([
      {
        code: 'WELCOME10',
        description: 'Giảm ngay 10% giá trị cho đơn hàng đầu tiên trải nghiệm tại VelvetStore',
        discountType: 'percent',
        discountValue: 10,
        minOrderValue: 300000,
        maxDiscount: 100000,
        usageLimit: 200,
        usedCount: 5,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true
      },
      {
        code: 'FREESHIP',
        description: 'Miễn phí vận chuyển toàn quốc cho đơn hàng trị giá từ 500.000₫',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderValue: 500000,
        maxDiscount: 30000,
        usageLimit: 500,
        usedCount: 12,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true
      },
      {
        code: 'SUMMER50',
        description: 'Ưu đãi chào hè giảm trực tiếp 50.000₫ cho hóa đơn mua sắm từ 400.000₫',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 400000,
        maxDiscount: 50000,
        usageLimit: 100,
        usedCount: 3,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-08-31'),
        isActive: true
      }
    ]);
    console.log('Đã tạo thành công các mã voucher giảm giá tri ân khách hàng');

    // --- 6. BÀI VIẾT BLOG (BLOGS) ---
    await Blog.bulkCreate([
      {
        title: '5 Bí quyết phối đồ cùng áo thun trắng cực ngầu và thu hút',
        slug: '5-bi-quyet-phoi-do-cung-ao-thun-trang',
        content: `<h2>Áo thun trắng - Vua của tủ quần áo thời trang tối giản</h2>
<p>Áo thun trắng luôn là item cốt lõi, basic nhất trong mọi phong cách tủ đồ nhưng lại chứa đựng khả năng biến hóa cực kỳ đa dạng tôn dáng. Dưới đây là 5 bí kíp thần thánh giúp bạn tỏa sáng mọi lúc.</p>
<h3>1. Áo thun trắng đi kèm Quần jean rách gối bụi bặm</h3>
<p>Combo bất hủ trường tồn theo năm tháng của phong cách dạo phố. Bạn có thể đóng thùng vạt trước (half-tuck) để tạo nét phóng khoáng đầy năng động.</p>
<h3>2. Áo thun trắng mix lịch sự cùng quần kaki đứng dáng</h3>
<p>Mang lại nét thanh lịch nhã nhặn công sở nhưng vẫn cực kỳ trẻ trung và thoải mái, lý tưởng cho những cuộc hẹn ăn uống cuối tuần.</p>
<h3>3. Áo thun trắng kết hợp chân váy Midi xếp ly duyên dáng</h3>
<p>Bí quyết phối đồ yêu kiều dành cho phái nữ. Việc nhét tà áo gọn gàng vào cạp chân váy thon thả giúp hack chiều cao tuyệt hảo duyên dáng.</p>
<h3>4. Phong cách layer thời thượng cùng Áo Blazer khoác ngoài</h3>
<p>Mặc chiếc blazer phom rộng bên ngoài áo thun basic mang lại sự cân bằng hoàn hảo giữa nét chuyên nghiệp chững chạc và thoải mái năng động.</p>
<h3>5. Kết hợp phụ kiện làm điểm nhấn ấn tượng</h3>
<p>Một chiếc kính râm đen bóng, thắt lưng da bò cao cấp đi kèm chiếc túi tote canvas đơn giản sẽ nâng tầm toàn bộ outfit của bạn tức thì.</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
        authorId: admin.id,
        isPublished: true
      },
      {
        title: 'Bùng nổ xu hướng thời trang Xuân Hè 2026 tinh tế tối giản',
        slug: 'xu-huong-thoi-trang-xuan-he-2026',
        content: `<h2>Sự trỗi dậy của phong cách Quiet Luxury nhã nhặn quý phái</h2>
<p>Thời trang năm 2026 đánh dấu sự lên ngôi đỉnh cao của chất lượng cốt lõi và các đường nét cắt may tối giản sang xịn mịn. VelvetStore mách bạn những xu hướng tâm điểm không thể ngó lơ!</p>
<h3>Tông màu pastel êm dịu thanh mát</h3>
<p>Sắc hồng thạch anh thanh tao, xanh mint dịu nhẹ mát mẻ hay be pastel trang nhã thống trị tuyệt đối tại các sàn diễn lớn.</p>
<h3>Chất liệu tự nhiên cao cấp - Lên ngôi của Linen và Lụa</h3>
<p>Với ưu thế siêu nhẹ bay bổng, Linen dệt thô tự nhiên và Lụa trơn Satin bồng bềnh mang lại nét sang trọng tĩnh lặng và sự thoáng mát lý tưởng tuyệt đỉnh cho ngày hè oi bức.</p>
<h3>Phom dáng tự nhiên phóng khoáng (Oversized & Relaxed)</h3>
<p>Rũ bỏ những đường bó sát gò bó, năm nay tôn vinh sự thoải mái tự nhiên của các thiết kế quần kaki baggy phom rộng hay sơ mi dáng relaxed rộng rãi bay bổng.</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
        authorId: admin.id,
        isPublished: true
      }
    ]);
    console.log('Đã tạo các bài blog thời trang định hình phong cách cực đẹp');

    // --- 7. PHƯƠNG THỨC VẬN CHUYỂN (SHIPPING METHODS) ---
    await ShippingMethod.bulkCreate([
      { name: 'Giao hàng tiêu chuẩn', description: 'Giao nhanh chóng an toàn toàn quốc trong vòng 3-5 ngày làm việc', fee: 30000, estimatedDays: '3-5 ngày', isActive: true },
      { name: 'Giao hàng nhanh', description: 'Giao hàng tốc độ cao liên tỉnh từ 1-2 ngày', fee: 50000, estimatedDays: '1-2 ngày', isActive: true },
      { name: 'Giao hàng hỏa tốc nội thành', description: 'Giao tức thì bằng shipper công nghệ trong ngày (chỉ áp dụng nội thành Hồ Chí Minh/Hà Nội)', fee: 80000, estimatedDays: 'Trong ngày', isActive: true }
    ]);
    console.log('Đã tạo thành công các tùy chọn giao nhận vận chuyển');

    // --- 8. CẤU HÌNH HỆ THỐNG (SYSTEM CONFIG) ---
    await SystemConfig.bulkCreate([
      { key: 'shop_name', value: 'VelvetStore' },
      { key: 'shop_phone', value: '0901 234 567' },
      { key: 'shop_email', value: 'contact@velvetstore.vn' },
      { key: 'shop_address', value: '123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh' },
      { key: 'shop_description', value: 'Thương hiệu thời trang tối giản chất lượng cao, định hình phong cách thời thượng trẻ trung hiện đại.' },
      { key: 'facebook_url', value: 'https://facebook.com/velvetstore' },
      { key: 'instagram_url', value: 'https://instagram.com/velvetstore' },
      { key: 'return_policy', value: 'VelvetStore cam kết hỗ trợ khách hàng đổi hàng miễn phí tận nơi cực nhanh trong vòng 30 ngày kể từ lúc nhận sản phẩm. Yêu cầu sản phẩm nguyên tem mác chưa qua giặt tẩy giặt là.' },
      { key: 'shipping_policy', value: 'Hệ thống tự động miễn phí vận chuyển 100% cho mọi đơn hàng giá trị từ 500.000₫ trên toàn lãnh thổ Việt Nam.' },
      { key: 'warranty_policy', value: 'Bảo hành chỉ thêu và đường may cúc khóa miễn phí trọn đời cho tất cả sản phẩm thời trang mua sắm từ hệ thống của VelvetStore.' }
    ]);
    console.log('Đã nạp đầy đủ cấu hình hoạt động hệ thống tối ưu');

    console.log('\n======================================================');
    console.log('  🎉 SEED DATABASE CHẤT LƯỢNG CAO THÀNH CÔNG! 🎉');
    console.log('======================================================');
    console.log('  🔒 Admin Đăng nhập:');
    console.log('     Email: admin@velvetstore.vn');
    console.log('     Password: admin123');
    console.log('  🔒 Khách hàng thật tiêu biểu (Mật khẩu chung: 123456):');
    console.log('     - Đặng Minh Khôi: khoi@gmail.com');
    console.log('     - Lê Phương Thảo: thao@gmail.com');
    console.log('     - Nguyễn Tiến Đạt: dat@gmail.com');
    console.log('     - Trần Quỳnh Chi: chi@gmail.com');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed database:', error);
    process.exit(1);
  }
};

seed();
