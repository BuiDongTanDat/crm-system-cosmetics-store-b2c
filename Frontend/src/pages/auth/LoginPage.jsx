import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { Blocks, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuthStore();

  const handleFieldChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!form.email) {
      newErrors.email = "Vui lòng nhập email";
      //toast.error("Vui lòng nhập email");
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email không hợp lệ";
      //toast.error("Email không hợp lệ");
    }
    if (!form.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
      //toast.error("Vui lòng nhập mật khẩu");
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await signIn(form.email, form.password);
      navigate("/");
    } catch (err) {
      //toast.error("Đăng nhập thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Background with overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: 'url("/images/background/bg.jpg")',
        }}
      />
      <div className=" flex flex-col gap-6 min-h-screen justify-center items-center relative z-10">
        <Card className="animate-fade-in transition duration-200 overflow-hidden p-0 border-border w-full max-w-2xl shadow-2xl">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form
              className="p-6 md:p-8 gap-4 flex flex-col"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col items-center text-center gap-0">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img
                    src="/images/logo/Logo.svg"
                    alt="Logo"
                    className="h-10 w-10"
                  />
                </a>
                <h1 className="text-2xl font-semibold">Đăng nhập</h1>
                <div className="text-sm text-slate-400">Đăng nhập để truy cập hệ thống</div>
              </div>
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={form.email}
                    onChange={handleFieldChange("email")}
                    className="pl-10"
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
                </div>
                
              </div>
              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu"
                    value={form.password}
                    onChange={handleFieldChange("password")}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute top-2.5 right-3 text-muted-foreground cursor-pointer hover:text-blue-500"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                
              </div>
              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Button
                type="submit"
                variant ="actionCreate"
                className="mt-2 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
            <div className="bg-white relative hidden md:block">
              <img
                src="/images/background/Login.png"
                alt="Image"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover w-full h-auto"
              />
            </div>
          </CardContent>
        </Card>
        <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offset-4">
          Bằng cách nhấn tiếp tục, bạn đồng ý với{" "}
          <a href="#">Điều khoản dịch vụ</a> và{" "}
          <a href="#">Chính sách bảo mật</a>.
        </div>
      </div>
    </>
  );
}
