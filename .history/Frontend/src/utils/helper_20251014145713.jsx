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
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Lấy nhãn mức độ ưu tiên
export const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'high':
      return 'Cao';
    case 'medium':
      return 'Trung bình';
    case 'low':
      return 'Thấp';
    default:
      return 'Không xác định';
  }
};

//Hàm tạo tên viết tắt từ tên đầy đủ
export const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

//Hàm kiểm tra email hợp lệ
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Hàm kiểm tra số điện thoại hợp lệ
export const isValidPhone = (phone) => {
  const phoneRegex = /^(0[3-9])+([0-9]{8})$/;
  return phoneRegex.test(phone);
};


//Hàm tính %
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};


// Hàm lấy trạng thái màu sắc
export const getStatusColor = (status) => {
  switch (status) {
    case 'active':
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'inactive':
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Hàm định dạng số điện thoại cho hiển thị
export const formatPhoneDisplay = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return phone;
};


//Hàm xuất dữ liệu thành file CSV
export const exportToCSV = (data, second = null, third = null) => {
  if (!data || data.length === 0) {
    throw new Error('Không có dữ liệu để xuất');
  }

  // Determine calling style:
  // - exportToCSV(data, filename, headers)
  // - exportToCSV(data, fieldMappingObject, filename)
  let csvData = data;
  let csvHeaders = null;
  let filename = 'data.csv';

  if (second && typeof second === 'object' && !Array.isArray(second)) {
    // second is a fieldMapping: prepare data using mapping, third is filename
    const fieldMapping = second;
    filename = typeof third === 'string' ? `${third}.csv` : 'data.csv';
    csvData = prepareDataForCSV(data, fieldMapping);
    if (!csvData || csvData.length === 0) {
      throw new Error('Không có dữ liệu hợp lệ để xuất sau khi ánh xạ');
    }
    csvHeaders = Object.keys(csvData[0]);
  } else {
    // second is filename, third is optional headers
    filename = typeof second === 'string' ? `${second}.csv` : 'data.csv';
    csvHeaders = third || Object.keys(data[0]);
    csvData = data;
  }

  // Create header row
  const headerRow = csvHeaders.join(',');

  // Create data rows
  const dataRows = csvData.map(row => {
    return csvHeaders.map(header => {
      const value = row[header] ?? row[header.replace(/\uFEFF/g, '')] ?? '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  // Combine header and data
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Add BOM to support UTF-8 in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
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

  // Chia dòng (giữ nguyên nội dung mô tả nhiều dòng)
  const lines = cleanText
    .split(/\r?\n(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
    .filter((l) => l.trim() !== "");

  if (lines.length < 2) {
    throw new Error("Không có dữ liệu hợp lệ trong file CSV");
  }

  // Header dòng đầu
  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.replace(/(^"|"$)/g, "").trim());

  // Các dòng dữ liệu
  const data = lines.slice(1).map((line) => {
    const values = line
      .split(delimiter)
      .map((v) => v.replace(/(^"|"$)/g, "").trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });

  return { headers, data };
}


// Hàm chuyển đổi dữ liệu để xuất CSV với custom mapping
export const prepareDataForCSV = (data, fieldMapping = {}) => {
  return data.map(item => {
    const mappedItem = {};
    Object.keys(fieldMapping).forEach(key => {
      const displayName = fieldMapping[key];
      mappedItem[displayName] = item[key] || '';
    });
    return mappedItem;
  });
};

// Chuẩn hóa dữ liệu số, một số file csv có giá trị tiền tệ có dấu phẩy, dấu chấm, khoảng trắng, ký tự ₫ hoặc %
export const cleanValue = (v) => {
    if (typeof v !== "string") return v;
    return v
      .replace(/[₫,%]/g, "") // xóa ₫ và %
      .replace(/\s/g, "") // xóa khoảng trắng
      .replace(/\./g, "") // xóa dấu .
      .trim();
  };