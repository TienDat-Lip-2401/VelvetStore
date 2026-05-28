require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Product, ProductImage, ProductVariant, Review, Voucher, Blog, ShippingMethod, SystemConfig } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối database thành công');

    await sequelize.sync({ force: true });
    console.log('Đã xóa và tạo lại bảng');

    // --- USERS ---
    const hashedPassword = await bcrypt.hash('123456', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin = await User.create({
      fullName: 'Quản trị viên',
      email: 'admin@velvetstore.vn',
      password: adminPassword,
      phone: '0901234567',
      role: 'admin',
      isActive: true
    }, { hooks: false });

    const customer1 = await User.create({
      fullName: 'Nguyễn Văn An',
      email: 'an@gmail.com',
      password: hashedPassword,
      phone: '0912345678',
      role: 'customer',
      isActive: true
    }, { hooks: false });

    const customer2 = await User.create({
      fullName: 'Trần Thị Bích',
      email: 'bich@gmail.com',
      password: hashedPassword,
      phone: '0923456789',
      role: 'customer',
      isActive: true
    }, { hooks: false });

    console.log('Đã tạo người dùng');

    // --- CATEGORIES ---
    const catAo = await Category.create({ name: 'Áo', slug: 'ao', description: 'Các loại áo thời trang nam nữ', image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400', isActive: true });
    const catQuan = await Category.create({ name: 'Quần', slug: 'quan', description: 'Quần jeans, kaki, shorts thời trang', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', isActive: true });
    const catVay = await Category.create({ name: 'Váy', slug: 'vay', description: 'Váy đầm nữ đa phong cách', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', isActive: true });
    const catPhuKien = await Category.create({ name: 'Phụ kiện', slug: 'phu-kien', description: 'Túi xách, mũ nón, thắt lưng', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400', isActive: true });

    // Sub-categories
    const catAoThun = await Category.create({ name: 'Áo thun', slug: 'ao-thun', description: 'Áo thun nam nữ', parentId: catAo.id, isActive: true });
    const catAoSoMi = await Category.create({ name: 'Áo sơ mi', slug: 'ao-so-mi', description: 'Áo sơ mi công sở và dạo phố', parentId: catAo.id, isActive: true });
    const catAoKhoac = await Category.create({ name: 'Áo khoác', slug: 'ao-khoac', description: 'Áo khoác gió, hoodie, bomber', parentId: catAo.id, isActive: true });
    const catQuanJean = await Category.create({ name: 'Quần jean', slug: 'quan-jean', description: 'Quần jean nam nữ các kiểu', parentId: catQuan.id, isActive: true });
    const catQuanKaki = await Category.create({ name: 'Quần kaki', slug: 'quan-kaki', description: 'Quần kaki công sở và casual', parentId: catQuan.id, isActive: true });

    console.log('Đã tạo danh mục');

    // --- PRODUCTS ---
    const products = [
      {
        name: 'Áo thun cổ tròn Basic',
        slug: 'ao-thun-co-tron-basic',
        description: 'Áo thun cotton 100% cao cấp, form regular fit thoải mái. Chất liệu cotton organic mềm mại, thấm hút mồ hôi tốt. Phù hợp mặc hàng ngày, đi chơi hoặc phối layer.',
        price: 250000,
        salePrice: 199000,
        categoryId: catAoThun.id,
        material: 'Cotton 100%',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1622445275576-721325763afe?w=600', isPrimary: false }
        ],
        variants: [
          { size: 'S', color: 'Trắng', stock: 50 },
          { size: 'M', color: 'Trắng', stock: 80 },
          { size: 'L', color: 'Trắng', stock: 60 },
          { size: 'XL', color: 'Trắng', stock: 40 },
          { size: 'S', color: 'Đen', stock: 45 },
          { size: 'M', color: 'Đen', stock: 75 },
          { size: 'L', color: 'Đen', stock: 55 },
          { size: 'M', color: 'Xám', stock: 30 }
        ]
      },
      {
        name: 'Áo sơ mi Oxford dài tay',
        slug: 'ao-so-mi-oxford-dai-tay',
        description: 'Áo sơ mi Oxford chất vải dệt kim cao cấp, form slim fit lịch lãm. Cổ button-down trẻ trung, phù hợp đi làm hoặc dạo phố cuối tuần.',
        price: 450000,
        salePrice: null,
        categoryId: catAoSoMi.id,
        material: 'Oxford Cotton',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=600', isPrimary: false }
        ],
        variants: [
          { size: 'S', color: 'Trắng', stock: 30 },
          { size: 'M', color: 'Trắng', stock: 50 },
          { size: 'L', color: 'Trắng', stock: 40 },
          { size: 'M', color: 'Xanh nhạt', stock: 35 },
          { size: 'L', color: 'Xanh nhạt', stock: 25 }
        ]
      },
      {
        name: 'Áo khoác Bomber thời trang',
        slug: 'ao-khoac-bomber-thoi-trang',
        description: 'Áo khoác bomber phong cách streetwear cá tính. Chất liệu polyester chống gió nhẹ, lót lụa mềm mịn. Bo gấu và tay áo co giãn tốt.',
        price: 680000,
        salePrice: 550000,
        categoryId: catAoKhoac.id,
        material: 'Polyester',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=600', isPrimary: false }
        ],
        variants: [
          { size: 'M', color: 'Đen', stock: 25 },
          { size: 'L', color: 'Đen', stock: 30 },
          { size: 'XL', color: 'Đen', stock: 20 },
          { size: 'M', color: 'Xanh rêu', stock: 15 },
          { size: 'L', color: 'Xanh rêu', stock: 20 }
        ]
      },
      {
        name: 'Quần jean slim fit',
        slug: 'quan-jean-slim-fit',
        description: 'Quần jean nam form slim fit tôn dáng, chất vải denim co giãn 2 chiều thoải mái vận động. Wash nhẹ hiện đại, phối đồ dễ dàng.',
        price: 550000,
        salePrice: 450000,
        categoryId: catQuanJean.id,
        material: 'Denim co giãn',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', isPrimary: false }
        ],
        variants: [
          { size: '29', color: 'Xanh đậm', stock: 35 },
          { size: '30', color: 'Xanh đậm', stock: 50 },
          { size: '31', color: 'Xanh đậm', stock: 45 },
          { size: '32', color: 'Xanh đậm', stock: 40 },
          { size: '30', color: 'Xanh nhạt', stock: 30 },
          { size: '31', color: 'Xanh nhạt', stock: 25 }
        ]
      },
      {
        name: 'Quần kaki baggy',
        slug: 'quan-kaki-baggy',
        description: 'Quần kaki baggy form rộng thoải mái, phong cách trẻ trung năng động. Chất kaki mềm, nhăn tự nhiên tạo nét phóng khoáng.',
        price: 420000,
        salePrice: null,
        categoryId: catQuanKaki.id,
        material: 'Kaki cotton',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600', isPrimary: true }
        ],
        variants: [
          { size: '29', color: 'Be', stock: 40 },
          { size: '30', color: 'Be', stock: 55 },
          { size: '31', color: 'Be', stock: 45 },
          { size: '30', color: 'Đen', stock: 35 },
          { size: '31', color: 'Đen', stock: 30 }
        ]
      },
      {
        name: 'Váy liền hoa nhí dáng xòe',
        slug: 'vay-lien-hoa-nhi-dang-xoe',
        description: 'Váy liền thân họa tiết hoa nhí vintage, dáng xòe nữ tính. Chất vải voan mềm mại bay bổng, phù hợp đi chơi, dạo phố, chụp ảnh.',
        price: 520000,
        salePrice: 420000,
        categoryId: catVay.id,
        material: 'Voan cao cấp',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', isPrimary: false }
        ],
        variants: [
          { size: 'S', color: 'Hồng', stock: 20 },
          { size: 'M', color: 'Hồng', stock: 30 },
          { size: 'L', color: 'Hồng', stock: 25 },
          { size: 'S', color: 'Xanh', stock: 15 },
          { size: 'M', color: 'Xanh', stock: 20 }
        ]
      },
      {
        name: 'Áo thun polo nam',
        slug: 'ao-thun-polo-nam',
        description: 'Áo polo nam cổ bẻ lịch sự, chất cotton pique thoáng mát. Form regular fit vừa vặn, phù hợp đi làm hoặc đi chơi.',
        price: 350000,
        salePrice: 289000,
        categoryId: catAoThun.id,
        material: 'Cotton Pique',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1625910513413-5fc420e7abbe?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'M', color: 'Xanh navy', stock: 40 },
          { size: 'L', color: 'Xanh navy', stock: 35 },
          { size: 'XL', color: 'Xanh navy', stock: 25 },
          { size: 'M', color: 'Trắng', stock: 30 },
          { size: 'L', color: 'Trắng', stock: 25 }
        ]
      },
      {
        name: 'Túi tote canvas thời trang',
        slug: 'tui-tote-canvas-thoi-trang',
        description: 'Túi tote canvas dày dặn, in họa tiết minimalist. Kích thước rộng rãi đựng được laptop 14 inch, sách vở và đồ cá nhân.',
        price: 280000,
        salePrice: null,
        categoryId: catPhuKien.id,
        material: 'Canvas',
        brand: 'VelvetStore',
        isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'Free size', color: 'Be', stock: 60 },
          { size: 'Free size', color: 'Đen', stock: 50 }
        ]
      },
      {
        name: 'Hoodie oversize unisex',
        slug: 'hoodie-oversize-unisex',
        description: 'Hoodie oversize phong cách Hàn Quốc, chất nỉ bông dày dặn giữ ấm tốt. Mũ trùm có dây rút, túi kangaroo tiện lợi.',
        price: 480000,
        salePrice: 390000,
        categoryId: catAoKhoac.id,
        material: 'Nỉ bông',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'M', color: 'Đen', stock: 30 },
          { size: 'L', color: 'Đen', stock: 40 },
          { size: 'XL', color: 'Đen', stock: 25 },
          { size: 'M', color: 'Xám', stock: 20 },
          { size: 'L', color: 'Xám', stock: 30 }
        ]
      },
      {
        name: 'Váy midi xếp ly công sở',
        slug: 'vay-midi-xep-ly-cong-so',
        description: 'Váy midi xếp ly thanh lịch, chất liệu polyester cao cấp không nhăn. Lưng thun co giãn thoải mái, phù hợp đi làm hoặc dự tiệc.',
        price: 460000,
        salePrice: null,
        categoryId: catVay.id,
        material: 'Polyester',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'S', color: 'Đen', stock: 25 },
          { size: 'M', color: 'Đen', stock: 35 },
          { size: 'L', color: 'Đen', stock: 20 },
          { size: 'S', color: 'Be', stock: 15 },
          { size: 'M', color: 'Be', stock: 25 }
        ]
      },
      {
        name: 'Áo sơ mi linen ngắn tay',
        slug: 'ao-so-mi-linen-ngan-tay',
        description: 'Áo sơ mi linen ngắn tay phong cách nghỉ dưỡng. Chất vải linen tự nhiên thoáng mát, form relaxed fit thoải mái.',
        price: 380000,
        salePrice: 320000,
        categoryId: catAoSoMi.id,
        material: 'Linen',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'M', color: 'Trắng', stock: 20 },
          { size: 'L', color: 'Trắng', stock: 25 },
          { size: 'XL', color: 'Trắng', stock: 15 },
          { size: 'M', color: 'Xanh nhạt', stock: 18 },
          { size: 'L', color: 'Xanh nhạt', stock: 22 }
        ]
      },
      {
        name: 'Quần shorts thể thao',
        slug: 'quan-shorts-the-thao',
        description: 'Quần shorts thể thao nam dáng ngắn trên gối, chất vải gió siêu nhẹ nhanh khô. Lưng thun co giãn có dây rút.',
        price: 280000,
        salePrice: 220000,
        categoryId: catQuan.id,
        material: 'Polyester',
        brand: 'VelvetStore',
        isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600', isPrimary: true }
        ],
        variants: [
          { size: 'M', color: 'Đen', stock: 45 },
          { size: 'L', color: 'Đen', stock: 50 },
          { size: 'XL', color: 'Đen', stock: 30 },
          { size: 'M', color: 'Xám', stock: 25 },
          { size: 'L', color: 'Xám', stock: 30 }
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
        totalSold: Math.floor(Math.random() * 100),
        avgRating: (3.5 + Math.random() * 1.5).toFixed(1)
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

    console.log('Đã tạo sản phẩm');

    // --- REVIEWS ---
    const allProducts = await Product.findAll();
    const reviewData = [
      { rating: 5, comment: 'Chất vải rất đẹp, mặc thoáng mát. Đúng size, giao hàng nhanh. Sẽ ủng hộ shop dài dài!' },
      { rating: 4, comment: 'Sản phẩm đẹp, đúng mô tả. Chỉ hơi rộng hơn mong đợi một chút nhưng vẫn ok.' },
      { rating: 5, comment: 'Mình rất hài lòng với chất lượng sản phẩm. Đường may tỉ mỉ, form đẹp.' },
      { rating: 3, comment: 'Sản phẩm tạm được, màu hơi khác so với hình. Nhưng chất vải thì ổn.' },
      { rating: 4, comment: 'Giao hàng nhanh, đóng gói cẩn thận. Áo mặc lên rất đẹp, vải mềm mịn.' },
      { rating: 5, comment: 'Quá tuyệt vời! Chất liệu cao cấp, mặc rất thoải mái. 10 điểm!' },
      { rating: 4, comment: 'Sản phẩm chất lượng, giá hợp lý. Ship nhanh, nhân viên tư vấn nhiệt tình.' },
      { rating: 5, comment: 'Đã mua lần 2, vẫn rất hài lòng. Chất vải bền, giặt không phai màu.' },
    ];

    let reviewIndex = 0;
    for (const prod of allProducts) {
      const numReviews = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numReviews; i++) {
        const rv = reviewData[reviewIndex % reviewData.length];
        await Review.create({
          userId: i % 2 === 0 ? customer1.id : customer2.id,
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

    console.log('Đã tạo đánh giá sản phẩm');

    // --- VOUCHERS ---
    await Voucher.bulkCreate([
      {
        code: 'WELCOME10',
        description: 'Giảm 10% cho đơn hàng đầu tiên',
        discountType: 'percent',
        discountValue: 10,
        minOrderValue: 300000,
        maxDiscount: 100000,
        usageLimit: 100,
        usedCount: 0,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true
      },
      {
        code: 'FREESHIP',
        description: 'Miễn phí vận chuyển cho đơn từ 500K',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderValue: 500000,
        maxDiscount: 30000,
        usageLimit: 200,
        usedCount: 0,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true
      },
      {
        code: 'SUMMER50',
        description: 'Giảm 50.000₫ cho đơn từ 400K',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 400000,
        maxDiscount: 50000,
        usageLimit: 50,
        usedCount: 0,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-30'),
        isActive: true
      }
    ]);

    console.log('Đã tạo mã giảm giá');

    // --- BLOGS ---
    await Blog.bulkCreate([
      {
        title: '5 cách phối đồ với áo thun trắng cực đẹp',
        slug: '5-cach-phoi-do-voi-ao-thun-trang',
        content: `<h2>Áo thun trắng - Item không thể thiếu</h2>
<p>Áo thun trắng là món đồ basic nhất trong tủ quần áo nhưng lại có khả năng phối đồ vô cùng đa dạng. Dưới đây là 5 cách phối đồ giúp bạn luôn nổi bật.</p>
<h3>1. Áo thun trắng + Quần jean</h3>
<p>Đây là combo kinh điển không bao giờ lỗi mốt. Bạn có thể chọn quần jean slim fit để tạo vẻ gọn gàng hoặc baggy jean để mang phong cách streetwear.</p>
<h3>2. Áo thun trắng + Quần kaki</h3>
<p>Sự kết hợp này mang lại vẻ thanh lịch nhưng vẫn thoải mái. Phù hợp khi đi làm hoặc hẹn hò cuối tuần.</p>
<h3>3. Áo thun trắng + Váy midi</h3>
<p>Với các bạn nữ, việc nhét áo thun vào váy midi sẽ tạo nên set đồ cực kỳ nữ tính và thời thượng.</p>
<h3>4. Layer với áo khoác</h3>
<p>Áo thun trắng là lớp base hoàn hảo để layer cùng bomber jacket, blazer hay áo cardigan.</p>
<h3>5. Phối cùng phụ kiện</h3>
<p>Thêm một chiếc túi tote, kính mát và sneakers trắng, bạn đã có ngay outfit đơn giản mà cực chất.</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
        authorId: admin.id,
        isPublished: true
      },
      {
        title: 'Xu hướng thời trang mùa hè 2026',
        slug: 'xu-huong-thoi-trang-mua-he-2026',
        content: `<h2>Những xu hướng nổi bật mùa hè 2026</h2>
<p>Mùa hè 2026 đánh dấu sự trở lại của nhiều xu hướng thời trang thú vị. Cùng VelvetStore khám phá những trend hot nhất!</p>
<h3>Màu sắc pastel</h3>
<p>Các tông màu pastel nhẹ nhàng như hồng phấn, xanh mint, tím lavender tiếp tục chiếm lĩnh sàn diễn thời trang.</p>
<h3>Chất liệu linen</h3>
<p>Linen tự nhiên thoáng mát trở thành lựa chọn hàng đầu cho mùa hè. Áo sơ mi linen, quần linen wide-leg là những item must-have.</p>
<h3>Phong cách tối giản</h3>
<p>Less is more - phong cách minimalist với gam màu trung tính, đường cắt gọn gàng vẫn là xu hướng chủ đạo.</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
        authorId: admin.id,
        isPublished: true
      },
      {
        title: 'Hướng dẫn chọn size quần áo chuẩn nhất',
        slug: 'huong-dan-chon-size-quan-ao',
        content: `<h2>Bí quyết chọn size quần áo online không bao giờ sai</h2>
<p>Mua sắm online tiện lợi nhưng nhiều người lo ngại việc chọn sai size. Dưới đây là hướng dẫn chi tiết giúp bạn chọn size chuẩn nhất.</p>
<h3>Cách đo số đo cơ thể</h3>
<p>Sử dụng thước dây mềm, đo vòng ngực, vòng eo, vòng hông và chiều dài tay. Ghi lại các số đo để so sánh với bảng size.</p>
<h3>Bảng quy đổi size</h3>
<p>Size S: Ngực 82-86cm, Eo 66-70cm<br>
Size M: Ngực 86-90cm, Eo 70-74cm<br>
Size L: Ngực 90-94cm, Eo 74-78cm<br>
Size XL: Ngực 94-98cm, Eo 78-82cm</p>
<h3>Lưu ý khi chọn size</h3>
<p>Nếu số đo nằm giữa 2 size, nên chọn size lớn hơn để thoải mái hơn. Với áo form oversize, có thể chọn đúng size hoặc nhỉnh hơn 1 size.</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600',
        authorId: admin.id,
        isPublished: true
      }
    ]);

    console.log('Đã tạo bài viết blog');

    // --- SHIPPING METHODS ---
    await ShippingMethod.bulkCreate([
      { name: 'Giao hàng tiêu chuẩn', description: 'Giao trong 3-5 ngày làm việc', fee: 30000, estimatedDays: '3-5 ngày', isActive: true },
      { name: 'Giao hàng nhanh', description: 'Giao trong 1-2 ngày làm việc', fee: 50000, estimatedDays: '1-2 ngày', isActive: true },
      { name: 'Giao hàng hỏa tốc', description: 'Giao trong ngày (nội thành)', fee: 80000, estimatedDays: 'Trong ngày', isActive: true }
    ]);

    console.log('Đã tạo phương thức vận chuyển');

    // --- SYSTEM CONFIG ---
    await SystemConfig.bulkCreate([
      { key: 'shop_name', value: 'VelvetStore' },
      { key: 'shop_phone', value: '0901 234 567' },
      { key: 'shop_email', value: 'contact@velvetstore.vn' },
      { key: 'shop_address', value: '123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh' },
      { key: 'shop_description', value: 'Thời trang chất lượng cao với phong cách hiện đại' },
      { key: 'facebook_url', value: 'https://facebook.com/velvetstore' },
      { key: 'instagram_url', value: 'https://instagram.com/velvetstore' },
      { key: 'return_policy', value: 'Đổi trả miễn phí trong 30 ngày kể từ ngày nhận hàng. Sản phẩm phải còn nguyên tem mác, chưa qua sử dụng.' },
      { key: 'shipping_policy', value: 'Miễn phí vận chuyển cho đơn hàng từ 500.000₫. Thời gian giao hàng từ 1-5 ngày tùy khu vực.' },
      { key: 'warranty_policy', value: 'Bảo hành 6 tháng cho các lỗi từ nhà sản xuất. Không bảo hành các trường hợp hư hỏng do người dùng.' }
    ]);

    console.log('Đã tạo cấu hình hệ thống');

    console.log('\n========================================');
    console.log('SEED DATABASE THÀNH CÔNG!');
    console.log('========================================');
    console.log('Admin: admin@velvetstore.vn / admin123');
    console.log('Customer: an@gmail.com / 123456');
    console.log('Customer: bich@gmail.com / 123456');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed database:', error);
    process.exit(1);
  }
};

seed();
