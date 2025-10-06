//File này chứa các hàm tiện ích dùng chung trong toàn bộ ứng dụng

// Định dạng tiền tệ VNĐ
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount);
};

//Hàm định dạng ngày
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

//Hàm định dạng ngày giờ
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('vi-VN');
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

//Hàm xuất dữ liệu thành file JSON
export const exportToJSON = (data, filename = 'data.json') => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = filename;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};


//Hàm nhập dữ liệu từ file JSON
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('File JSON không hợp lệ'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file'));
    reader.readAsText(file);
  });
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
