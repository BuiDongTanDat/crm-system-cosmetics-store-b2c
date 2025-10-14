//File này chứa các hàm tiện ích dùng chung trong toàn bộ ứng dụng

// Định dạng tiền tệ VNĐ
export const formatCurrency = (amount, suffix = "VNĐ") =>
  `${new Intl.NumberFormat("vi-VN").format(amount)} ${suffix}`;


//Hàm định dạng ngày
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

//Hàm định dạng ngày giờ
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('vi-VN');
};

//Định dạng ngày và giờ riêng biệt
export const formatDateTimeSeparate = (dateString) => {
  const dateObj = new Date(dateString);
  const date = dateObj.toLocaleDateString('vi-VN');
  const time = dateObj.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { date, time };
};

// Lấy màu sắc theo mức độ ưu tiên
export const getPriorityColor = (priority) => {
  switch (priority) {
    default:
      return 'gray';
  }
};

// Lấy nhãn mức độ ưu tiên
export const getPriorityLabel = (priority) => {
  switch (priority) {
    default:
      return 'Bình thường';
  }
};

//Hàm tạo tên viết tắt từ tên đầy đủ
export const getInitials = (name) => {
  if (!name) return '';
  return String(name).split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase();
};

//Hàm kiểm tra email hợp lệ
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Hàm kiểm tra số điện thoại hợp lệ
export const isValidPhone = (phone) => {
  const phoneRegex = /^(0[3-9])[0-9]{8}$/;
  return phoneRegex.test(String(phone).replace(/\D/g, ''));
};


//Hàm tính %
export const calculatePercentage = (value, total) => {
  if (!total) return 0;
  return Math.round((Number(value) / Number(total)) * 100);
};


// Hàm lấy trạng thái màu sắc
export const getStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'available':
    case 'đang bán':
      return 'green';
    case 'out':
    case 'hết hàng':
      return 'red';
    default:
      return 'gray';
  }
};

// Hàm định dạng số điện thoại cho hiển thị
export const formatPhoneDisplay = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  return phone;
};


//Hàm xuất dữ liệu thành file CSV
// signature: exportToCSV(data, fieldMapping = {}, filename = 'data.csv')
export const exportToCSV = (data, fieldMapping = {}, filename = 'data.csv') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('exportToCSV: no data to export');
    return;
  }

  // If fieldMapping is provided as object english->label, use labels order from keys
  const keys = Object.keys(fieldMapping).length ? Object.keys(fieldMapping) : Object.keys(data[0]);
  const headers = keys.map(k => (fieldMapping[k] ?? k));

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    // escape double quotes by doubling them
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = data.map(row => keys.map(k => escapeCell(row[k] ?? '')).join(','));
  const content = [headers.join(','), ...rows].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

//Hàm nhập dữ liệu từ file CSV
export async function importFromCSV(file) {
  // Đọc toàn bộ nội dung file (dạng UTF-8)
  const text = await file.text();

  // Loại bỏ BOM (nếu có)
  const cleanText = text.replace(/^\uFEFF/, "");

  // Dò dấu phân cách: ưu tiên tab > chấm phẩy > phẩy
  const delimiter = cleanText.includes("\t")
    ? "\t"
    : cleanText.includes(";")
    ? ";"
    : ",";

  // Chia dòng nhưng giữ nguyên các field có dấu ngoặc kép và dấu xuống dòng bên trong
  // Sử dụng regex để split vào dòng mới nếu số dấu ngoặc kép bên trước là chẵn
  const lines = cleanText.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 1) return { headers: [], data: [] };

  // Parse header
  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') {
          // escaped quote
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === delimiter && !inQuotes) {
        result.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    result.push(cur);
    return result.map(cell => cell.replace(/(^"|"$)/g, '').trim());
  };

  const headers = parseLine(lines[0]);

  const data = [];
  // join continuation lines if quotes are not balanced
  let buffer = '';
  let openQuotes = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    buffer = buffer ? buffer + '\n' + line : line;
    // count quotes (excluding escaped "")
    const quotes = (buffer.match(/"/g) || []).length;
    if (quotes % 2 === 0) {
      // complete record
      const cells = parseLine(buffer);
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = cells[j] ?? '';
      }
      data.push(obj);
      buffer = '';
    } else {
      // continue to next line
      continue;
    }
  }

  // if still buffer non empty, attempt parse
  if (buffer) {
    const cells = parseLine(buffer);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = cells[j] ?? '';
    }
    data.push(obj);
  }

  return { headers, data };
}


// Hàm chuyển đổi dữ liệu để xuất CSV với custom mapping
export const prepareDataForCSV = (data, fieldMapping = {}) => {
  if (!Array.isArray(data)) return [];
  const keys = Object.keys(fieldMapping).length ? Object.keys(fieldMapping) : (data[0] ? Object.keys(data[0]) : []);
  return data.map(item => {
    const obj = {};
    keys.forEach(k => {
      obj[k] = item[k] ?? '';
    });
    return obj;
  });
};

// Chuẩn hóa dữ liệu số, một số file csv có giá trị tiền tệ có dấu phẩy, dấu chấm, khoảng trắng, ký tự ₫ hoặc %
export const cleanValue = (v) => {
  if (v === null || v === undefined) return "";
  let s = String(v).replace(/\uFEFF/g, '').trim();

  if (s === '') return "";

  // remove non-printable chars
  s = s.replace(/[\u0000-\u001F]/g, '');

  // If contains percent sign, keep sign but remove percent
  const isPercent = s.includes('%');

  // Remove currency symbols and letters except digits, comma, dot, minus
  s = s.replace(/[^\d\-,.]/g, '');

  // heuristics:
  // if both dot and comma present -> assume dot as thousand separator, comma as decimal
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');

  if (hasDot && hasComma) {
    // remove dots (thousands), replace comma by dot (decimal)
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else if (hasDot && !hasComma) {
    // if multiple dots and all group lengths 3 -> remove dots (thousands)
    const parts = s.split('.');
    if (parts.length > 1 && parts.slice(1).every(p => p.length === 3)) {
      s = parts.join('');
    }
    // else keep dot as decimal
  } else if (!hasDot && hasComma) {
    // if multiple commas and groups length 3 -> remove commas
    const parts = s.split(',');
    if (parts.length > 1 && parts.slice(1).every(p => p.length === 3)) {
      s = parts.join('');
    } else {
      // assume comma decimal -> replace with dot
      s = s.replace(/,/g, '.');
    }
  }

  // remove leading/trailing separators
  s = s.replace(/^[\.\-]+|[\.\-]+$/g, '');

  const num = parseFloat(s);
  if (!isNaN(num)) {
    // if percent, return numeric percent (e.g. "-34" from "-34 %")
    return isPercent ? num : (Number.isInteger(num) ? Math.round(num) : num);
  }

  return s;
};