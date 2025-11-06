const fs = require('fs'); //File system module dùng để đọc file 
const Product = require('../../Domain/Entities/Product');
const { Op } = require('sequelize');


class ProductRepository {
  // Lấy sản phẩm theo ID
  async findById(productId) {
    const product = await Product.findByPk(productId);
    return product || null;
  }
  async findByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    // Nếu PK của Product là 'id'
    return Product.findAll({
      where: { product_id: { [Op.in]: ids } },
    });

    // Nếu PK thực tế là 'product_id' thì dùng:
    // return Product.findAll({ where: { product_id: { [Op.in]: ids } } });
  }
  // Lấy tất cả sản phẩm
  async findAll() {
    return await Product.findAll();
  }

  // Tạo hoặc cập nhật sản phẩm
  async save(product) {
    //console.log('Product to save:', product);
    if (product && product.product_id) {
      const existingProduct = await Product.findByPk(product.product_id);
      if (existingProduct) {
        // prepare update data without primary key to avoid trying to change it
        const updateData = { ...product };
        delete updateData.product_id;

        // perform update and return the updated instance (Sequelize returns the updated instance)
        const updated = await existingProduct.update(updateData, { returning: true });
        return updated;
      }
    }
    return await Product.create(product);
  }


  // Xóa sản phẩm theo ID
  async delete(productId) {
    // trả về số bản ghi bị xóa (0 hoặc 1)
    return await Product.destroy({ where: { product_id: productId } });
  }

  // Lấy sản phẩm theo tên (ví dụ tìm kiếm)
  async findByName(name) {
    return await Product.findAll({
      where: { name }
    });
  }

  // Lấy sản phẩm theo category
  async findByCategory(category) {
    return await Product.findAll({
      where: { category }
    });
  }

  // Cập nhật số lượng tồn kho
  async updateInventory(productId, qty) {
    const product = await Product.findByPk(productId);
    if (!product) return null;
    product.inventory_qty = qty;
    await product.save();
    return product;
  }

  // Import from CSV file (filePath provided inside dto.filePath)
  // Mục đích cua hàm này cần trả về chi tiết lỗi để người dùng biết mà sửa
  async importFromCSV(dto) {
    const filePath = dto && dto.filePath;
    if (!filePath) throw new Error('filePath là bắt buộc cho importFromCSV');

    // Parser dòng CSV nhỏ (xử lý trường có dấu ngoặc kép và dấu phẩy bên trong dấu ngoặc kép)
    function parseLine(line) {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          result.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      result.push(cur);
      return result.map(s => s.trim());
    }

    // Dùng bộ csv-parse nếu có
    let records = [];
    let headerArr = null;
    const content = fs.readFileSync(filePath, 'utf8');
    // normalize BOM and remove weird chars at start
    const normalizedContent = content.replace(/^\uFEFF/, '');

    const errors = [];

    //Chỗ này mình tách thử nên  dùng csv-parse được hay không
    // Không thì mình parse thủ công bằng cái hàm ở trên á
    try {
      const parse = require('csv-parse/lib/sync');
      // Parse into arrays (not columns:true) so we can map by header indexes and preserve empty fields
      const parsed = parse(normalizedContent, { skip_empty_lines: true, relax_column_count: true });
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('CSV rỗng hoặc không hợp lệ');
      headerArr = parsed[0].map(h => (h || '').toString().trim());
      for (let r = 1; r < parsed.length; r++) {
        const rowArr = parsed[r];
        const rowIndex = r + 1; // file line number (header is 1)
        if (!Array.isArray(rowArr) || rowArr.length !== headerArr.length) {
          errors.push({ row: rowIndex + 1, message: `Số cột không khớp với header (Yêu cầu ${headerArr.length}, Số cột nhận được ${Array.isArray(rowArr) ? rowArr.length : 0})` });
          continue;
        }
        const obj = {};
        for (let i = 0; i < headerArr.length; i++) {
          obj[headerArr[i]] = rowArr[i] !== undefined ? rowArr[i] : '';
        }
        records.push(obj);
      }
    } catch (e) {
      // Không dùng được csv-parse thì dùng hàm parseLine tự viết
      const lines = normalizedContent.split(/\r?\n/);
      const nonEmptyLines = lines.filter(l => l.trim() !== '');
      if (nonEmptyLines.length === 0) throw new Error('CSV rỗng hoặc không hợp lệ');
      const headerLine = nonEmptyLines[0];
      headerArr = parseLine(headerLine);
      const dataLines = nonEmptyLines.slice(1);
      for (let r = 0; r < dataLines.length; r++) {
        const line = dataLines[r];
        const values = parseLine(line);
        const rowIndex = r + 2; // header is line 1
        if (values.length !== headerArr.length) {
          errors.push({ row: rowIndex, message: `Số cột không khớp với header (Yêu cầu ${headerArr.length}, Số cột nhận được ${values.length})` });
          continue;
        }
        const obj = {};
        for (let i = 0; i < headerArr.length; i++) {
          obj[headerArr[i]] = values[i] !== undefined ? values[i] : '';
        }
        records.push(obj);
      }
    }

    // mapping header tiếng Việt -> entity fields, chủ yếu file csv ra
    // label tiếng Việt có dấu
    const fieldMap = {
      'Tên sản phẩm': 'name',
      'Thương hiệu': 'brand',
      'Danh mục': 'category',
      'Mô tả ngắn': 'short_description',
      'Mô tả chi tiết': 'description',
      'Ảnh': 'image',
      'Giá hiện tại': 'price_current',
      'Giá gốc': 'price_original',
      'Giảm giá (%)': 'discount_percent',
      'Đánh giá': 'rating',
      'Số lượt đánh giá': 'reviews_count',
      'Doanh số hàng tháng': 'monthly_sales',
      'Tiến độ bán hàng': 'sell_progress',
      'Tồn kho': 'inventory_qty',
      'Trạng thái': 'status',
    };

    const newProducts = [];
    let updatedCount = 0;
    const seenNames = {}; // để kiểm tra trùng tên trong file CSV
    const createdInstances = [];

    const normalizeName = n => (n || '').toString().trim().toLowerCase();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowIndex = i + 2; // tại vì dòng tiêu đề là dòng 1
      // map fields
      const mapped = {};
      for (const key of Object.keys(row)) {
        const target = fieldMap[key] || key; // nếu tiêu đề đã là tiếng Anh thì giữ nguyên
        mapped[target] = row[key];
      }

      // Chỗ này mình convert và validate dữ liệu đơn giản
      const name = (mapped.name || '').toString().trim();
      const price_current = mapped.price_current !== undefined && mapped.price_current !== ''
        ? parseFloat(String(mapped.price_current).replace(/[^\d.\-]/g, ''))
        : null;
      const price_original = mapped.price_original !== undefined && mapped.price_original !== ''
        ? parseFloat(String(mapped.price_original).replace(/[^\d.\-]/g, ''))
        : null;
      const discount_percent = mapped.discount_percent !== undefined && mapped.discount_percent !== ''
        ? parseFloat(String(mapped.discount_percent).replace(/[^\d.\-]/g, ''))
        : null;
      const rating = mapped.rating !== undefined && mapped.rating !== '' ? parseFloat(mapped.rating) : 0;
      const reviews_count = mapped.reviews_count !== undefined && mapped.reviews_count !== '' ? parseInt(mapped.reviews_count, 10) : 0;
      const inventory_qty = mapped.inventory_qty !== undefined && mapped.inventory_qty !== '' ? parseInt(String(mapped.inventory_qty).replace(/[^\d\-]/g, ''), 10) : 0;
      const monthly_sales = mapped.monthly_sales || '';
      const sell_progress = mapped.sell_progress || '';
      const brand = mapped.brand || null;
      const category = mapped.category || null;
      const short_description = mapped.short_description || '';
      const description = mapped.description || '';
      const image = mapped.image || null;
      const status = mapped.status || 'AVAILABLE';

      // Trả lỗi nếu mấy trường bắt buộc thiếu hoặc không hợp lệ
      if (!name) {
        errors.push({ row: rowIndex, field: 'name', message: 'Thiếu tên sản phẩm' });
        continue;
      }
      if (price_current == null || Number.isNaN(price_current)) {
        errors.push({ row: rowIndex, field: 'price_current', message: 'Giá hiện tại không hợp lệ hoặc thiếu' });
        continue;
      }

      // Trả lỗi nếu tên sản phẩm trùng trong file CSV
      const nname = normalizeName(name);
      if (seenNames[nname]) {
        errors.push({ row: rowIndex, field: 'name', message: `Tên sản phẩm bị trùng trong file (với dòng ${seenNames[nname]})` });
        continue;
      }
      seenNames[nname] = rowIndex;

      // Trả lỗi nếu đã có trong DB (không phân biệt hoa thường)
      let existing = null;
      try {
        existing = await Product.findOne({ where: { name: { [Op.iLike]: name } } });
      } catch (err) {
        // ignore DB lookup error for this row and mark as failed
        errors.push({ row: rowIndex, message: `Lỗi truy vấn DB: ${err.message}` });
        continue;
      }

      const productData = {
        name,
        brand,
        category,
        short_description,
        description,
        image,
        price_current,
        price_original,
        discount_percent,
        rating,
        reviews_count,
        monthly_sales,
        sell_progress,
        inventory_qty,
        status,
      };

      if (existing) {
        // Nếu sản phẩm đã tồn tại -> cập nhật
        try {
          // Tránh thay đổi primary key
          const updateData = { ...productData };
          await existing.update(updateData);
          updatedCount++;
        } catch (err) {
          errors.push({ row: rowIndex, message: `Cập nhật thất bại: ${err.message}` });
        }
      } else {
        // Sản phẩm mới thì thêm vào danh sách tạo mới
        newProducts.push(productData);
      }
    } // Kết thúc ghi

    let importedCount = 0;
    // bulk create newProducts
    if (newProducts.length > 0) {
      try {
        const created = await Product.bulkCreate(newProducts, { returning: true, validate: true });
        importedCount = created.length;
        createdInstances.push(...created);
      } catch (bulkErr) {
        // Nếu bulkCreate lỗi (ví dụ do ràng buộc duy nhất), thử tạo từng cái một để biết cái nào lỗi
        for (let j = 0; j < newProducts.length; j++) {
          const item = newProducts[j];
          try {
            const c = await Product.create(item);
            importedCount++;
            createdInstances.push(c);
          } catch (err) {
            // Nếu tạo từng cái một mà lỗi thì ghi lỗi với tên sản phẩm
            errors.push({ row: null, name: item.name, message: `Tạo sản phẩm thất bại: ${err.message}` });
          }
        }
      }
    }

    const failedCount = errors.length;
    return {
      importedCount,
      updatedCount,
      failedCount,
      errors
    };
  }

  //Hàm export thành CSV
  async exportToCSV() {
    const products = await Product.findAll();
    if (!products || products.length === 0) {
      return '';
    }
    const header = [
      'Tên sản phẩm',
      'Thương hiệu',
      'Danh mục',
      'Mô tả ngắn',
      'Mô tả chi tiết',
      'Ảnh',
      'Giá hiện tại',
      'Giá gốc',
      'Giảm giá (%)',
      'Đánh giá',
      'Số lượt đánh giá',
      'Doanh số hàng tháng',
      'Tiến độ bán hàng',
      'Tồn kho',
      'Trạng thái'
    ];
    const lines = [];
    lines.push(header.join(','));
    for (const p of products) {
      const row = [
        `"${(p.name || '').toString().replace(/"/g, '""')}"`,
        `"${(p.brand || '').toString().replace(/"/g, '""')}"`,
        `"${(p.category || '').toString().replace(/"/g, '""')}"`,
        `"${(p.short_description || '').toString().replace(/"/g, '""')}"`,
        `"${(p.description || '').toString().replace(/"/g, '""')}"`,
        `"${(p.image || '').toString().replace(/"/g, '""')}"`,
        p.price_current != null ? p.price_current : '',
        p.price_original != null ? p.price_original : '',
        p.discount_percent != null ? p.discount_percent : '',
        p.rating != null ? p.rating : '',
        p.reviews_count != null ? p.reviews_count : '',
        `"${(p.monthly_sales || '').toString().replace(/"/g, '""')}"`,
        `"${(p.sell_progress || '').toString().replace(/"/g, '""')}"`,
        p.inventory_qty != null ? p.inventory_qty : '',
        `"${(p.status || '').toString().replace(/"/g, '""')}"`
      ];
      lines.push(row.join(','));
    }
    return lines.join('\n');
  }

}

module.exports = new ProductRepository();