//DATA HIỂN THỊ CHUNG
//Data vai trò
export const RoleList = [
  "Admin",
  "Sales",
  "Marketing",
  "Support"
];

//Trạng thái nhân viên
export const StatusList = [
  "Active",
  "Inactive"
];

//Danh mục sản phẩm
export const Category = {
  cosmetics: "Mỹ phẩm",
  skincare: "Chăm sóc da",
  makeup: "Trang điểm"
};

//Trạng thái sản phẩm
export const ProductStatus = {
  available: "Phân phối",
  outOfStock: "Hết hàng",
  discontinued: "Ngừng bán"
};

//Loại chiến dịch Marketing
export const CampaignTypeList = [
  "Email",
  "SMS",
  "Ads",
  "Social Media",
  "Content Marketing",
  "SEO"
];

//Trạng thái chiến dịch
export const CampaignStatusList = [
  "Draft",
  "Running",
  "Completed",
  "Paused"
];

//Phương thức thanh toán
export const PaymentMethod = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  credit: "Thẻ tín dụng",
  wallet: "Ví điện tử",
  cod: "COD"
};

//Trạng thái đơn hàng
export const OrderStatus = {
  new: "Đơn hàng mới",
  processing: "Đang xử lý",
  completed: "Đã giao",
  cancelled: "Đã hủy"
};

//DATA MẪU
//Data mẫu sản phẩm
export const sampleProducts = [
  {
    id: 1,
    name: "Majun Pandora",
    image: "/images/products/product_temp.png",
    price: 240000,
    category: "Mỹ phẩm",
    stock: 50,
    status: "Phân phối",
    description: "Serum dưỡng da, giúp sáng và mịn da. Thành phần tự nhiên."
  },
  {
    id: 2,
    name: "Serum Vitamin C",
    image: "/images/products/product_temp.png",
    price: 280000,
    category: "Chăm sóc da",
    stock: 20,
    status: "Phân phối",
    description: "Serum Vitamin C giúp làm sáng và đều màu da."
  },
  {
    id: 3,
    name: "Kem dưỡng ẩm Majun",
    image: "/images/products/product_temp.png",
    price: 320000,
    category: "Chăm sóc da",
    stock: 0,
    status: "Hết hàng",
    description: "Kem dưỡng ẩm chuyên sâu cho da khô và nhạy cảm."
  },
  {
    id: 4,
    name: "Majun Pandora",
    image: "/images/products/product_temp.png",
    price: 240000,
    category: "Mỹ phẩm",
    stock: 50,
    status: "Phân phối",
    description: "Serum dưỡng da, giúp sáng và mịn da. Thành phần tự nhiên."
  },
  {
    id: 5,
    name: "Serum Vitamin C",
    image: "/images/products/product_temp.png",
    price: 280000,
    category: "Chăm sóc da",
    stock: 20,
    status: "Phân phối",
    description: "Serum Vitamin C giúp làm sáng và đều màu da."
  },
  {
    id: 6,
    name: "Kem dưỡng ẩm Majun",
    image: "/images/products/product_temp.png",
    price: 320000,
    category: "Chăm sóc da",
    stock: 0,
    status: "Hết hàng",
    description: "Kem dưỡng ẩm chuyên sâu cho da khô và nhạy cảm."
  },
  {
    id: 7,
    name: "Majun Pandora",
    image: "/images/products/product_temp.png",
    price: 240000,
    category: "Mỹ phẩm",
    stock: 50,
    status: "Phân phối",
    description: "Serum dưỡng da, giúp sáng và mịn da. Thành phần tự nhiên."
  },
  {
    id: 7,
    name: "Serum Vitamin C",
    image: "/images/products/product_temp.png",
    price: 280000,
    category: "Chăm sóc da",
    stock: 20,
    status: "Phân phối",
    description: "Serum Vitamin C giúp làm sáng và đều màu da."
  },
  {
    id: 8,
    name: "Kem dưỡng ẩm Majun",
    image: "/images/products/product_temp.png",
    price: 320000,
    category: "Chăm sóc da",
    stock: 0,
    status: "Hết hàng",
    description: "Kem dưỡng ẩm chuyên sâu cho da khô và nhạy cảm."
  }
];

//Data mẫu nhân viên
export const mockEmployees = [
  { id: 1, name: "Nguyễn Văn A", email: "admin@example.com", phone: "0123456789", role: "Admin", status: "Active" },
  { id: 2, name: "Trần Thị B", email: "sales@example.com", phone: "0987654321", role: "Sales", status: "Active" },
  { id: 3, name: "Lê Văn C", email: "marketing@example.com", phone: "0111222333", role: "Marketing", status: "Inactive" },
  { id: 4, name: "Phạm Thị D", email: "support@example.com", phone: "0444555666", role: "Support", status: "Active" }
];

//Data mẫu chiến dịch Marketing
export const mockCampaigns = [
  {
    id: 1,
    name: "Khuyến mãi mùa hè 2024",
    type: "Email",
    budget: 50000000,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    targetAudience: "Khách hàng VIP",
    dataSource: "Customers",
    status: "Running",
    assignee: "Nguyễn Văn A",
    assigneeId: 1,
    expectedKPI: "Tăng 25% doanh thu",
    performance: {
      reach: 15000,
      openRate: 35.5,
      clickRate: 8.2,
      newLeads: 450,
      actualCost: 35000000,
      revenue: 120000000,
      roi: 242.8,
      lastUpdated: "2024-07-15"
    }
  },
  {
    id: 2,
    name: "Ra mắt sản phẩm mới",
    type: "Social Media",
    budget: 30000000,
    startDate: "2024-07-01",
    endDate: "2024-07-31",
    targetAudience: "Khách hàng 18-35 tuổi",
    dataSource: "Leads",
    status: "Completed",
    assignee: "Trần Thị B",
    assigneeId: 2,
    expectedKPI: "10000 lượt tương tác",
    performance: {
      reach: 25000,
      openRate: 0,
      clickRate: 12.5,
      newLeads: 320,
      actualCost: 28000000,
      revenue: 85000000,
      roi: 203.5,
      lastUpdated: "2024-08-01"
    }
  }
];

//Data mẫu đơn hàng
export const mockOrders = [
  {
    id: 1,
    customerId: 1,
    customerName: "Chi Phiến",
    orderDate: "2025-09-10",
    totalAmount: 480000,
    paymentMethod: "Tiền mặt",
    status: "Đơn hàng mới",
    orderDetails: [
      { id: 1, orderId: 1, productId: 1, productName: "Majun Pandora", quantity: 2, price: 240000 }
    ]
  },
  {
    id: 2,
    customerId: 2,
    customerName: "Lê Hoàng",
    orderDate: "2025-09-12",
    totalAmount: 560000,
    paymentMethod: "Chuyển khoản",
    status: "Đang xử lý",
    orderDetails: [
      { id: 2, orderId: 2, productId: 2, productName: "Serum Vitamin C", quantity: 2, price: 280000 }
    ]
  },
  {
    id: 3,
    customerId: 3,
    customerName: "Ngọc Mai",
    orderDate: "2025-09-13",
    totalAmount: 320000,
    paymentMethod: "Thẻ tín dụng",
    status: "Đã giao",
    orderDetails: [
      { id: 3, orderId: 3, productId: 3, productName: "Kem dưỡng ẩm Majun", quantity: 1, price: 320000 }
    ]
  },
  {
    id: 4,
    customerId: 4,
    customerName: "Tuấn Minh",
    orderDate: "2025-09-14",
    totalAmount: 600000,
    paymentMethod: "Ví điện tử",
    status: "Đã hủy",
    orderDetails: [
      { id: 4, orderId: 4, productId: 2, productName: "Serum Vitamin C", quantity: 2, price: 300000 }
    ]
  },
  {
    id: 5,
    customerId: 5,
    customerName: "Hoài An",
    orderDate: "2025-09-15",
    totalAmount: 480000,
    paymentMethod: "COD",
    status: "Đơn hàng mới",
    orderDetails: [
      { id: 5, orderId: 5, productId: 1, productName: "Majun Pandora", quantity: 2, price: 240000 }
    ]
  }
];

//Data mẫu báo cáo
export const reportData = {
  // Báo cáo doanh số theo nhân viên
  salesByEmployee: [
    { name: "Nguyễn Văn A", sales: 120000000, orders: 45, month: "2024-01" },
    { name: "Trần Thị B", sales: 98000000, orders: 38, month: "2024-01" },
    { name: "Lê Văn C", sales: 85000000, orders: 32, month: "2024-01" },
    { name: "Phạm Thị D", sales: 76000000, orders: 28, month: "2024-01" },
  ],

  // Báo cáo doanh số theo sản phẩm
  salesByProduct: [
    { name: "Majun Pandora", sales: 180000000, quantity: 520, category: "Mỹ phẩm" },
    { name: "Serum Vitamin C", sales: 145000000, quantity: 420, category: "Chăm sóc da" },
    { name: "Kem dưỡng ẩm", sales: 98000000, quantity: 280, category: "Chăm sóc da" },
    { name: "Son môi", sales: 76000000, quantity: 190, category: "Trang điểm" },
  ],

  // Doanh số theo thời gian
  salesByTime: [
    { month: "Jan", sales: 45000000, orders: 180 },
    { month: "Feb", sales: 52000000, orders: 210 },
    { month: "Mar", sales: 48000000, orders: 195 },
    { month: "Apr", sales: 61000000, orders: 245 },
    { month: "May", sales: 55000000, orders: 220 },
    { month: "Jun", sales: 67000000, orders: 280 },
  ],

  // CSAT Score
  csatData: {
    currentScore: 4.2,
    trend: "+0.3",
    breakdown: [
      { category: "Chất lượng sản phẩm", score: 4.5 },
      { category: "Dịch vụ khách hàng", score: 4.1 },
      { category: "Giao hàng", score: 3.9 },
      { category: "Giá cả", score: 4.0 },
    ]
  },

  // NPS Score
  npsData: {
    score: 68,
    trend: "+5",
    segments: [
      { type: "Promoters", percentage: 72, count: 360 },
      { type: "Passives", percentage: 20, count: 100 },
      { type: "Detractors", percentage: 8, count: 40 },
    ]
  },

  // Customer Churn Rate
  churnData: {
    rate: 12.5,
    trend: "-2.1",
    bySegment: [
      { segment: "VIP", rate: 5.2 },
      { segment: "Regular", rate: 15.8 },
      { segment: "New", rate: 18.5 },
    ],
    prediction: [
      { month: "Jan", predicted: 14.2, actual: 13.8 },
      { month: "Feb", predicted: 13.5, actual: 14.1 },
      { month: "Mar", predicted: 12.8, actual: 12.5 },
      { month: "Apr", predicted: 11.9, actual: null },
    ]
  },

  // Hiệu quả chiến dịch Marketing
  campaignPerformance: [
    { name: "Khuyến mãi mùa hè", roi: 242.8, leads: 450, revenue: 120000000, cost: 35000000 },
    { name: "Ra mắt sản phẩm mới", roi: 203.5, leads: 320, revenue: 85000000, cost: 28000000 },
    { name: "Black Friday", roi: 189.2, leads: 680, revenue: 150000000, cost: 42000000 },
  ],

  // Tương tác khách hàng
  customerInteraction: {
    frequency: [
      { channel: "Email", interactions: 1250, satisfaction: 4.1 },
      { channel: "Phone", interactions: 890, satisfaction: 4.3 },
      { channel: "Chat", interactions: 760, satisfaction: 3.9 },
      { channel: "Social Media", interactions: 540, satisfaction: 4.0 },
    ],
    quality: {
      responseTime: "2.5 hours",
      resolutionRate: "94.2%",
      firstContactResolution: "78.5%"
    }
  }
};

//Test

//Kanban Board - B2C Sales Pipeline
export const kanbanColumns = [
  {
    id: 'leads',
    title: 'Leads',
    color: 'bg-blue-100 border-blue-200',
    headerColor: 'bg-blue-500',
    count: 0
  },
  {
    id: 'contacted',
    title: 'Contacted',
    color: 'bg-yellow-100 border-yellow-200',
    headerColor: 'bg-yellow-500',
    count: 0
  },
  {
    id: 'qualified',
    title: 'Qualified',
    color: 'bg-purple-100 border-purple-200',
    headerColor: 'bg-purple-500',
    count: 0
  },
  {
    id: 'nurturing ',
    title: 'Nurturing ',
    color: 'bg-orange-100 border-orange-200',
    headerColor: 'bg-orange-500',
    count: 0
  },
  {
    id: 'converted',
    title: 'Converted',
    color: 'bg-green-100 border-green-200',
    headerColor: 'bg-green-500',
    count: 0
  },
  {
    id: 'closed-lost',
    title: 'Closed-lost',
    color: 'bg-red-100 border-red-200',
    headerColor: 'bg-red-500',
    count: 0
  }
];

export const kanbanCards = [
  {
    id: '1',
    title: 'Mua serum chống lão hóa',
    customer: 'Chi Phiến',
    email: 'chiphien@email.com',
    phone: '0901234567',
    value: 2500000,
    source: 'Website',
    assignee: 'Nguyễn Văn A',
    assigneeId: 1,
    priority: 'high',
    products: ['Serum Vitamin C', 'Kem dưỡng ẩm'],
    notes: 'Khách hàng quan tâm đến sản phẩm chống lão hóa cao cấp',
    createdDate: '2024-01-15',
    lastActivity: '2024-01-20',
    stage: 'leads',
    status: 'leads'
  },
  {
    id: '2',
    title: 'Combo skincare',
    customer: 'Nguyễn Thu Hà',
    email: 'thuha@email.com',
    phone: '0912345678',
    value: 1800000,
    source: 'Facebook',
    assignee: 'Trần Thị B',
    assigneeId: 2,
    priority: 'medium',
    products: ['Sữa rửa mặt', 'Toner', 'Kem dưỡng'],
    notes: 'Khách hàng mới, cần tư vấn về quy trình skincare',
    createdDate: '2024-01-18',
    lastActivity: '2024-01-22',
    stage: 'contacted',
    status: 'contacted'
  },
  {
    id: '3',
    title: 'Sản phẩm nam',
    customer: 'Lê Minh Tuấn',
    email: 'minhtuan@email.com',
    phone: '0923456789',
    value: 1200000,
    source: 'Giới thiệu',
    assignee: 'Nguyễn Văn A',
    assigneeId: 1,
    priority: 'medium',
    products: ['Gel rửa mặt nam', 'Kem chống nắng'],
    notes: 'Được bạn giới thiệu, đã mua sản phẩm trước đây',
    createdDate: '2024-01-20',
    lastActivity: '2024-01-25',
    stage: 'qualified',
    status: 'qualified'
  },
  {
    id: '4',
    title: 'Đơn hàng lớn',
    customer: 'Phạm Thị Lan',
    email: 'thilan@email.com',
    phone: '0934567890',
    value: 5200000,
    source: 'Zalo',
    assignee: 'Lê Văn C',
    assigneeId: 3,
    priority: 'high',
    products: ['Set skincare premium', 'Serum đặc biệt'],
    notes: 'Khách VIP, cần ưu tiên xử lý',
    createdDate: '2024-01-12',
    lastActivity: '2024-01-28',
    stage: 'nurturing ',
    status: 'nurturing '
  },
  {
    id: '5',
    title: 'Thương lượng giá',
    customer: 'Hoàng Văn Nam',
    email: 'vannam@email.com',
    phone: '0945678901',
    value: 3100000,
    source: 'Website',
    assignee: 'Phạm Thị D',
    assigneeId: 4,
    priority: 'high',
    products: ['Bộ sản phẩm trị mụn'],
    notes: 'Đang thương lượng về giá và chính sách ưu đãi',
    createdDate: '2024-01-10',
    lastActivity: '2024-01-29',
    stage: 'converted',
    status: 'converted'
  },
  {
    id: '6',
    title: 'Đã mua thành công',
    customer: 'Trần Thị Mai',
    email: 'thimai@email.com',
    phone: '0956789012',
    value: 2800000,
    source: 'Instagram',
    assignee: 'Trần Thị B',
    assigneeId: 2,
    priority: 'medium',
    products: ['Combo chăm sóc da mặt'],
    notes: 'Đã hoàn thành giao dịch, khách hàng hài lòng',
    createdDate: '2024-01-08',
    lastActivity: '2024-01-30',
    stage: 'converted',
    status: 'converted'
  },
  {
    id: '7',
    title: 'Không mua',
    customer: 'Vũ Thành Long',
    email: 'thanhlong@email.com',
    phone: '0967890123',
    value: 1500000,
    source: 'Google Ads',
    assignee: 'Nguyễn Văn A',
    assigneeId: 1,
    priority: 'low',
    products: ['Kem chống nắng'],
    notes: 'Khách hàng quyết định không mua do giá cao',
    createdDate: '2024-01-05',
    lastActivity: '2024-01-25',
    stage: 'closed-lost',
    status: 'closed-lost'
  }
];

export const mockRoles = [
    { id: 1, name: "Admin", description: "Quản trị viên hệ thống", permissions: ["read", "write", "delete"], status: "Active" },
    { id: 2, name: "Sales", description: "Nhân viên bán hàng", permissions: ["read", "write"], status: "Active" },
    { id: 3, name: "Marketing", description: "Nhân viên marketing", permissions: ["read", "write"], status: "Active" },
    { id: 4, name: "Support", description: "Nhân viên hỗ trợ", permissions: ["read"], status: "Active" }
];

export const CustomerTypes = {
    vip: "VIP",
    premium: "Premium", 
    standard: "Tiêu chuẩn",
    new: "Mới"
};

export const CustomerSources = {
    referral: "Giới thiệu",
    ads: "Quảng cáo",
    event: "Sự kiện", 
    website: "Website",
    social: "Mạng xã hội",
    direct: "Trực tiếp"
};

export const Industries = [
    "Công nghệ thông tin",
    "Bán lẻ",
    "Giáo dục",
    "Y tế",
    "Tài chính",
    "Bất động sản",
    "Du lịch",
    "Sản xuất",
    "Dịch vụ",
    "Khác"
];

export const mockCustomers = [
    {
        id: 1,
        name: "Nguyễn Văn An",
        type: CustomerTypes.vip,
        birthDate: "1985-03-15",
        gender: "Nam",
        industry: "Công nghệ thông tin",
        email: "nva@gmail.com",
        phone: "0901234567",
        address: "123 Đường ABC, Q1, TP.HCM",
        socialMedia: "Facebook: nva.dev",
        source: CustomerSources.referral,
        notes: "Khách hàng tiềm năng, quan tâm đến sản phẩm cao cấp",
        tags: ["tech", "premium", "loyal"],
        status: "Active"
    },
    {
        id: 2,
        name: "Trần Thị Bình",
        type: CustomerTypes.premium,
        birthDate: "1990-07-22",
        gender: "Nữ",
        industry: "Bán lẻ",
        email: "ttb@yahoo.com",
        phone: "0912345678",
        address: "456 Đường XYZ, Q3, TP.HCM",
        socialMedia: "Instagram: @ttbinh",
        source: CustomerSources.ads,
        notes: "Thường xuyên mua hàng, thích sản phẩm mới",
        tags: ["fashion", "frequent"],
        status: "Active"
    },
    {
        id: 3,
        name: "Lê Minh Cường",
        type: CustomerTypes.standard,
        birthDate: "1988-12-10",
        gender: "Nam", 
        industry: "Giáo dục",
        email: "lmc@edu.vn",
        phone: "0923456789",
        address: "789 Đường DEF, Q7, TP.HCM",
        socialMedia: "LinkedIn: leminhcuong",
        source: CustomerSources.website,
        notes: "Quan tâm đến chương trình giảm giá",
        tags: ["education", "budget"],
        status: "Active"
    },
    {
        id: 4,
        name: "Phạm Thu Hà",
        type: CustomerTypes.new,
        birthDate: "1995-05-18",
        gender: "Nữ",
        industry: "Y tế",
        email: "pth@hospital.com",
        phone: "0934567890",
        address: "321 Đường GHI, Q5, TP.HCM",
        socialMedia: "Zalo: 0934567890",
        source: CustomerSources.event,
        notes: "Mới tham gia, cần tư vấn thêm",
        tags: ["new", "medical"],
        status: "Active"
    },
    {
        id: 5,
        name: "Nguyễn Văn An",
        type: CustomerTypes.vip,
        birthDate: "1985-03-15",
        gender: "Nam",
        industry: "Công nghệ thông tin",
        email: "nva@gmail.com",
        phone: "0901234567",
        address: "123 Đường ABC, Q1, TP.HCM",
        socialMedia: "Facebook: nva.dev",
        source: CustomerSources.referral,
        notes: "Khách hàng tiềm năng, quan tâm đến sản phẩm cao cấp",
        tags: ["tech", "premium", "loyal"],
        status: "Active"
    },
    {
        id: 6,
        name: "Trần Thị Bình",
        type: CustomerTypes.premium,
        birthDate: "1990-07-22",
        gender: "Nữ",
        industry: "Bán lẻ",
        email: "ttb@yahoo.com",
        phone: "0912345678",
        address: "456 Đường XYZ, Q3, TP.HCM",
        socialMedia: "Instagram: @ttbinh",
        source: CustomerSources.ads,
        notes: "Thường xuyên mua hàng, thích sản phẩm mới",
        tags: ["fashion", "frequent"],
        status: "Active"
    },
    {
        id: 7,
        name: "Lê Minh Cường",
        type: CustomerTypes.standard,
        birthDate: "1988-12-10",
        gender: "Nam", 
        industry: "Giáo dục",
        email: "lmc@edu.vn",
        phone: "0923456789",
        address: "789 Đường DEF, Q7, TP.HCM",
        socialMedia: "LinkedIn: leminhcuong",
        source: CustomerSources.website,
        notes: "Quan tâm đến chương trình giảm giá",
        tags: ["education", "budget"],
        status: "Active"
    },
    {
        id: 8,
        name: "Phạm Thu Hà",
        type: CustomerTypes.new,
        birthDate: "1995-05-18",
        gender: "Nữ",
        industry: "Y tế",
        email: "pth@hospital.com",
        phone: "0934567890",
        address: "321 Đường GHI, Q5, TP.HCM",
        socialMedia: "Zalo: 0934567890",
        source: CustomerSources.event,
        notes: "Mới tham gia, cần tư vấn thêm",
        tags: ["new", "medical"],
        status: "Active"
    }
];


export const notifications = [
  {
    id: 'n1',
    title: 'Deal mới được tạo',
    message: 'Deal "Khách hàng A - Gói B" vừa được tạo bởi Minh.',
    time: '2 giờ trước',
    read: false,
  },
  {
    id: 'n2',
    title: 'Deal chuyển trạng thái',
    message: 'Deal "Khách hàng C" đã chuyển sang "Đang đàm phán".',
    time: 'Hôm qua',
    read: false,
  },
  {
    id: 'n3',
    title: 'Nhắc nhở liên hệ',
    message: 'Hẹn gọi lại với Khách hàng D vào ngày mai 10:00.',
    time: '2 ngày trước',
    read: true,
  }
];