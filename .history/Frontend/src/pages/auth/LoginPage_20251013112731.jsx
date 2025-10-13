import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const DISABLE_AUTH_REDIRECT = import.meta.env.VITE_DISABLE_AUTH_REDIRECTS === 'true';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // Kiểm tra nếu đã đăng nhập thì chuyển hướng
  useEffect(() => {
    if (DISABLE_AUTH_REDIRECT) return; // Tạm thời ẩn để thiết kế
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.email || !form.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gia rlaapj xác thực
      if (form.email === 'admin@example.com' && form.password === 'password') {
        toast.success('Đăng nhập thành công!');
        login();
        navigate('/', { replace: true });
      } else {
        toast.error('Email hoặc mật khẩu không chính xác');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm: handler đăng nhập bằng Google (mô phỏng)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Đăng nhập bằng Google thành công!');
      login();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

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
            {/* Thêm: logo + brand */}
            <div className="flex items-center justify-center space-x-3">
              <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-10 w-10" />
              <span className="text-2xl font-extrabold text-foreground">LuBoo</span>
            </div>

            <CardTitle className="text-2xl font-bold text-foreground">
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Nhập thông tin để truy cập vào hệ thống
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={form.email}
                    onChange={handleChange('email')}
                    className="pl-10"
                    disabled={isLoading}
                    variant="project"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={handleChange('password')}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleChange('rememberMe')}
                    className="h-4 w-4 text-primary border-border rounded focus:ring-ring"
                    disabled={isLoading}
                  />
                  <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button - styled like project buttons */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                variant="actionCreate"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">hoặc</span>
                </div>
              </div>

              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <span className="inline-flex items-center">
                  {/* Simple Google SVG icon */}
                  <svg className="h-4 w-4" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path fill="#4285f4" d="M533.5 278.4c0-17.6-1.6-35-4.8-51.8H272v98.1h146.9c-6.3 34-25.1 62.8-53.5 82v68.3h86.4c50.6-46.6 81.7-115.3 81.7-196.6z"/>
                    <path fill="#34a853" d="M272 544.3c72.6 0 133.6-24.1 178.2-65.4l-86.4-68.3c-24.1 16.2-55.1 25.7-91.8 25.7-70.6 0-130.4-47.6-151.9-111.6H31.1v70.1C75.6 486.9 167.6 544.3 272 544.3z"/>
                    <path fill="#fbbc04" d="M120.1 323.7c-10.7-31.6-10.7-65.6 0-97.2V156.4H31.1c-39.2 76.9-39.2 168.1 0 245z"/>
                    <path fill="#ea4335" d="M272 107.9c39.3 0 74.6 13.6 102.4 40.4l76.8-76.8C405.1 24.2 344.1 0 272 0 167.6 0 75.6 57.4 31.1 156.4l89-70.1C141.6 155.5 201.4 107.9 272 107.9z"/>
                  </svg>
                </span>
                <span>Đăng nhập với Google</span>
              </Button>

              {/* Sign Up Link */}
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  Chưa có tài khoản?{' '}
                  <Link
                    to="/auth/signup"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Đăng ký ngay
                  </Link>
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}