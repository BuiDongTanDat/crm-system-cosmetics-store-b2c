import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // For reset password via email link
  
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if this is a password reset (has token) or change password (requires current password)
  const isPasswordReset = !!token;

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const toggleShowPassword = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!isPasswordReset && !form.currentPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return false;
    }
    if (!form.newPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return false;
    }
    if (form.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return false;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return false;
    }
    if (!isPasswordReset && form.currentPassword === form.newPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock password change - in real app, replace with actual API call
      setIsSuccess(true);
      toast.success('Mật khẩu đã được thay đổi thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Background with overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: 'url("/images/background/bg.jpg")',
          }}
        />
        
        <div className="relative z-10 w-full max-w-md">
          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Thành công!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Mật khẩu của bạn đã được thay đổi thành công
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p>Bạn có thể sử dụng mật khẩu mới để đăng nhập vào hệ thống</p>
              </div>

              <Button
                onClick={handleGoToLogin}
                className="w-full"
              >
                Đăng nhập ngay
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background with overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: 'url("/images/background/bg.jpg")',
        }}
      />
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              {isPasswordReset ? 'Đặt lại mật khẩu' : 'Thay đổi mật khẩu'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isPasswordReset 
                ? 'Nhập mật khẩu mới cho tài khoản của bạn'
                : 'Cập nhật mật khẩu để bảo mật tài khoản'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password Field - only show if not password reset */}
              {!isPasswordReset && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPasswords.current ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu hiện tại"
                      value={form.currentPassword}
                      onChange={handleChange('currentPassword')}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('current')}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPasswords.new ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    value={form.newPassword}
                    onChange={handleChange('newPassword')}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('new')}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('confirm')}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
                <p className="font-medium mb-1">Yêu cầu mật khẩu:</p>
                <ul className="space-y-1">
                  <li>• Tối thiểu 6 ký tự</li>
                  <li>• Nên bao gồm chữ hoa, chữ thường và số</li>
                  <li>• Tránh sử dụng thông tin cá nhân</li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>

              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate(isPasswordReset ? '/auth/login' : -1)}
                disabled={isLoading}
              >
                Hủy bỏ
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}