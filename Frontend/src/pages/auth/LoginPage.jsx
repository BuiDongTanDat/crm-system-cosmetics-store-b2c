import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore'; // dùng Zustand

export default function LoginPage() {
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState("");
  const inputRef = useRef(null);
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });

  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading, isAuthenticated } = useAuthStore(); // isAuthenticated là boolean

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);


  // email-specific input handling and suggestion behavior
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, email: val }));
    // Show suggestion only when user types '@' and there's nothing after it
    if (val.endsWith('@')) {
      setSuggestion('gmail.com');
    } else {
      setSuggestion('');
    }
  };

  const handleEmailKeyDown = (e) => {
    if (!suggestion) return;
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const newEmail = (form.email || '') + suggestion;
      setForm(prev => ({ ...prev, email: newEmail }));
      setSuggestion('');
      // move caret to end
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = newEmail.length;
        }
      });
    }
  };

  // generic handler for other fields
  const handleFieldChange = (field) => (e) => {
    const value = field === 'rememberMe' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const success = await signIn(form.email, form.password); // success sẽ là true
      if (success) {
        navigate('/', { replace: true }); // chuyển hướng ngay lập tức
      }
    } catch (err) {
      // toast lỗi đã hiển thị bên trong signIn
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: 'url("/images/background/bg.jpg")' }}
      />
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center space-x-3">
              <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Đăng nhập</CardTitle>
            <CardDescription className="text-muted-foreground">
              Nhập thông tin để truy cập vào hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={form.email}
                    onChange={handleEmailChange}
                    onKeyDown={handleEmailKeyDown}
                    className="pl-10"
                    disabled={loading}
                    variant="project"
                    autoComplete="email"
                    name="email"
                  />
                  {/* Suggestion shown only when user typed '@' at end */}
                  {suggestion ? (
                    <div className="absolute right-3 top-1.5 text-sm text-muted-foreground select-none pointer-events-none">
                      {suggestion} <span className="text-[10px] border p-1 rounded-sm bg-gray-100">Tab | Enter</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={handleFieldChange('password')}
                    className="pl-10 pr-10"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleFieldChange('rememberMe')}
                    className="h-4 w-4 text-primary border-border rounded focus:ring-ring"
                    disabled={loading}
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

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={loading} variant="actionCreate">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
