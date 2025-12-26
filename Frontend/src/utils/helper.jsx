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
    case 'urgent':
      return 'bg-orange-100 text-orange-800 border-orange-200';
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
    case 'urgent':
      return 'khẩn cấp';
    default:
      return 'Không xác định';
  }
};

//Hàm tạo tên viết tắt từ tên đầy đủ
export function getInitials(input) {
  if (!input || typeof input !== 'string') return 'NA';
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  return parts.slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

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

// Hàm lấy nhãn cho các khoảng thời gian
export function getPeriodLabel(period) {
  const now = new Date();

  const format = (date) =>
    date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  if (period === "today") {
    return `Hôm nay (${format(now)})`;
  }

  if (period === "week") {
    const start = new Date(now);
    const end = new Date(now);

    // getDay(): CN = 0 => đổi thành 7 cho dễ tính
    const day = now.getDay() === 0 ? 7 : now.getDay();

    start.setDate(now.getDate() - (day - 1)); // Thứ 2
    end.setDate(start.getDate() + 6); // Chủ nhật

    return `Tuần này (${format(start)} – ${format(end)})`;
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return `Tháng này (${format(start)} – ${format(end)})`;
  }

  if (period === "quarter") {
    const currentMonth = now.getMonth();
    const quarter = Math.floor(currentMonth / 3); // 0–3

    const start = new Date(now.getFullYear(), quarter * 3, 1);
    const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);

    return `Quý này (${format(start)} – ${format(end)})`;
  }

  return "";
}

// Hàm lấy ngày bắt đầu của khoảng thời gian
export const getStartDate = (periodKey) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (periodKey) {
    case 'today':
      return startOfToday;
    case 'week': {
      const day = now.getDay() === 0 ? 7 : now.getDay(); // Chủ nhật = 7
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() - (day - 1)); // Thứ 2
      return startOfWeek;
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter':
      return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    default:
      return startOfToday;
  }
};

// Hàm lấy ngày bắt đầu trong N ngày gần đây
export const getRollingStartDate = (days) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);
  return startDate;
}

// Tính tổng doanh thu
export const computeRevenue = (ordersRaw, periodKey, orderDateFn, orderTotalFn) => {
  const startDate = getStartDate(periodKey);
  let sum = 0;

  for (const o of ordersRaw) {
    const d = orderDateFn(o);
    const total = orderTotalFn(o);

    if (!d || Number.isNaN(d.getTime())) {
      if (periodKey === 'month' || periodKey === 'quarter') sum += total;
      continue;
    }

    if (d >= startDate) sum += total;
  }

  return sum;
};

//Lọc đơn pending (Chỗ này nữa có thể thay đổi cho phù hợp nha)
export const filterPendingOrders = (ordersRaw) => {
  return ordersRaw.filter(o => {
    const s = (o.status || o.state || '').toString().toLowerCase();
    return ['pending', 'chờ', 'processing', 'wait'].some(k => s.includes(k));
  });
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
export const exportToCSV = (data, filename = 'data.csv', headers = null) => {
  if (!data || data.length === 0) {
    throw new Error('Không có dữ liệu để xuất');
  }

  // Tự động tạo headers từ keys của object đầu tiên nếu không được cung cấp
  const csvHeaders = headers || Object.keys(data[0]);

  // Tạo header row
  const headerRow = csvHeaders.join(',');

  // Tạo data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header] || '';
      // Escape quotes và wrap trong quotes nếu có comma hoặc quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  // Kết hợp header và data
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Thêm BOM để hỗ trợ UTF-8 trong Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Tạo link download
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
export const importFromCSV = (file, hasHeader = true) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
          reject(new Error('File CSV trống'));
          return;
        }

        // Parse CSV với xử lý quotes
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const parsedLines = lines.map(parseCSVLine);

        if (hasHeader) {
          const headers = parsedLines[0];
          const dataLines = parsedLines.slice(1);

          const data = dataLines.map(line => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = line[index] || '';
            });
            return obj;
          });

          resolve({ headers, data });
        } else {
          resolve({ headers: null, data: parsedLines });
        }
      } catch (error) {
        reject(new Error('Lỗi phân tích file CSV: ' + error.message));
      }
    };

    reader.onerror = () => reject(new Error('Lỗi đọc file'));
    reader.readAsText(file, 'UTF-8');
  });
};

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