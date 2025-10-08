import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Camera, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    bio: '',
    avatar: ''
  });

  // Mock user data - in real app, fetch from API
  useEffect(() => {
    const mockUserData = {
      fullName: 'Nguyễn Văn An',
      email: 'admin@example.com',
      phone: '0123456789',
      birthDate: '1990-01-15',
      address: 'Hà Nội, Việt Nam',
      bio: 'Quản trị viên hệ thống với 5 năm kinh nghiệm trong lĩnh vực công nghệ thông tin.',
      avatar: '/images/user/Tom meme.jpg'
    };
    setForm(mockUserData);
  }, []);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm(prev => ({ ...prev, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thông tin đã được cập nhật thành công!');
      setMode('view');
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original data if needed
    setMode('view');
  };

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </div>
        
        {mode === 'view' ? (
          <Button onClick={() => setMode('edit')} className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Chỉnh sửa</span>
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Đang lưu...' : 'Lưu'}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Ảnh đại diện</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-muted">
                  {form.avatar ? (
                    <img 
                      src={form.avatar} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {mode === 'edit' && (
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">{form.fullName}</h3>
                <p className="text-muted-foreground">{form.email}</p>
              </div>
              
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">
                  Nhấp vào biểu tượng camera để thay đổi ảnh
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/auth/change-password">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Đổi mật khẩu
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Cài đặt thông báo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
              <CardDescription>
                Thông tin cá nhân và liên lạc của bạn
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={form.fullName}
                      onChange={handleChange('fullName')}
                      disabled={mode === 'view'}
                      className="pl-10"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      disabled={true} // Email usually can't be changed
                      className="pl-10 bg-muted/50"
                      placeholder="Email của bạn"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email không thể thay đổi. Liên hệ admin nếu cần hỗ trợ.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      disabled={mode === 'view'}
                      className="pl-10"
                      placeholder="Số điện thoại"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={form.birthDate}
                      onChange={handleChange('birthDate')}
                      disabled={mode === 'view'}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Địa chỉ
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={form.address}
                    onChange={handleChange('address')}
                    disabled={mode === 'view'}
                    className="pl-10"
                    placeholder="Địa chỉ của bạn"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Giới thiệu bản thân
                </label>
                <textarea
                  value={form.bio}
                  onChange={handleChange('bio')}
                  disabled={mode === 'view'}
                  className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Viết vài dòng giới thiệu về bản thân..."
                />
              </div>

              {/* Account Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Thông tin tài khoản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Ngày tạo tài khoản
                    </label>
                    <Input
                      value="15/01/2023"
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Lần đăng nhập cuối
                    </label>
                    <Input
                      value="08/10/2025 14:30"
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}