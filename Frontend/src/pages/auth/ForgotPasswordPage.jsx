import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { forgotPassword } from '@/services/auth';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setIsLoading(true);

    try {
      // Call real API
      await forgotPassword(email);
      setIsEmailSent(true);
      toast.success('Email đặt lại mật khẩu đã được gửi!');
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };


  if (isEmailSent) {
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
              {/* logo (match LoginPage) */}
              <div className="flex items-center justify-center mb-2">
                <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-10 w-10" />
              </div>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Email đã được gửi
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Kiểm tra hộp thư của bạn tại:
                </p>
                <p className="text-sm font-medium text-foreground bg-muted/50 p-2 rounded">
                  {email}
                </p>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Không nhận được email? Kiểm tra thư mục Spam hoặc:</p>
                
              </div>

              <Button
                onClick={() => {
                  // return to the input form so user can re-enter email
                  setIsEmailSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                Nhập lại email
              </Button>

              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Quay lại đăng nhập
                </Link>
              </div>
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

      <div className="relative z-10 w-full max-w-2xl">
        <Card className="animate-fade-in transition duration-200 shadow-lg border-0 bg-card/95 backdrop-blur-sm overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2">
            {/* Left image  */}
            <div className="bg-white relative hidden md:block">
              <img
                src="/images/background/forgot.png"
                alt="Image"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover w-full h-auto"
              />
            </div>
            {/* Form */}
            <div className="flex flex-col justify-center">
              <CardHeader className="space-y-1 text-center">
                {/* logo (match LoginPage) */}
                <div className="flex items-center justify-center mb-2">
                  <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Quên mật khẩu
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Nhập email để nhận hướng dẫn đặt lại mật khẩu
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
                      <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu đến email này
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    variant="actionCreate"
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Đang gửi...' : 'Gửi'}
                  </Button>

                  {/* Back to Login */}
                  <div className="text-center">
                    <Link
                      to="/auth/login"
                      className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Quay lại đăng nhập
                    </Link>
                  </div>
                </form>
              </CardContent>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}