import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { resetPassword } from '@/services/auth';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResetSuccess, setIsResetSuccess] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });

    useEffect(() => {
        if (!token) {
            toast.error('Token không hợp lệ hoặc không tìm thấy.');
        }
    }, [token]);

    const toggleShowPassword = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Token không hợp lệ. Vui lòng kiểm tra link reset.');
            return;
        }

        if (!newPassword || !confirmPassword) {
            toast.error('Vui lòng nhập đầy đủ mật khẩu mới và xác nhận.');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Mật khẩu phải có ít nhất 8 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp.');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword(token, newPassword);
            setIsResetSuccess(true);
            toast.success('Mật khẩu đã được đặt lại!');
        } catch (error) {
            toast.error('Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isResetSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
                    style={{
                        backgroundImage: 'url("/images/background/bg.jpg")',
                    }}
                />
                <div className="relative z-10 w-full max-w-md">
                    <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-10 w-10" />
                            </div>
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-foreground">
                                Đặt lại mật khẩu thành công
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Bạn có thể đăng nhập bằng mật khẩu mới.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <Button 
                            variant="outline"
                            onClick={() => navigate('/auth/login')} className="w-full">
                                Quay lại đăng nhập
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
                style={{
                    backgroundImage: 'url("/images/background/bg.jpg")',
                }}
            />
            <div className="relative z-10 w-full max-w-md">
                <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-foreground">
                            Đặt lại mật khẩu
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Nhập mật khẩu mới của bạn
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Mật khẩu mới</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        placeholder="Nhập mật khẩu mới"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        placeholder="Xác nhận mật khẩu mới"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                <p className="text-xs text-muted-foreground">
                                    Mật khẩu phải có ít nhất 8 ký tự.
                                </p>
                            </div>

                            <Button 
                            variant = "actionCreate"
                            type="submit" 
                            className="w-full" disabled={isLoading}>
                                {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
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
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}