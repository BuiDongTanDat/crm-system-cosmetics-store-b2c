import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Edit,
  FileUser,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { getUserById, changePassword, updateUser, updateAvatar } from '@/services/users';
import AppDialog from '@/components/dialogs/AppDialog';
import ChangePasswordForm from './components/ChangePasswordForm';
import AvatarForm from './components/AvatarForm';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore(); // dùng user từ zustand
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    avatar: '',
    bio: '',
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAvatarForm, setShowAvatarForm] = useState(false);

  useEffect(() => {
    const userId = user?.user_id;
    if (!userId) return;
    console.log('Fetching user data for userId:', userId);

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await getUserById(userId); // Gọi API lấy thông tin user
        setForm({
          fullName: res.full_name || '',
          email: res.email || '',
          phone: res.phone || '',
          role: res.role_name || '',
          avatar: res.avatar_url || '/images/user/Tom.jpg',
          bio: res.bio || '',
        });
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải thông tin người dùng');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [user]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };


  // Cập nhật thông tin user
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        full_name: form.fullName,
        phone: form.phone,
        bio: form.bio,
      };

      const userId = user?.user_id ?? user?.id;
      if (!userId) throw new Error('User id not available');

      const updatedUser = await updateUser(userId, payload);
      toast.success('Thông tin đã được cập nhật thành công!');
      setMode('view');

      setUser((prev) => ({
        ...prev,
        name: updatedUser.full_name ?? updatedUser.name ?? prev?.name,
        email: updatedUser.email ?? prev?.email,
        avatar:
          updatedUser.avatar_url ?? updatedUser.avatar ?? prev?.avatar,
        role: updatedUser.role_name ?? updatedUser.role ?? prev?.role,
        user_id:
          updatedUser.user_id ??
          updatedUser.id ??
          prev?.user_id ??
          prev?.id,
        id:
          updatedUser.id ??
          updatedUser.user_id ??
          prev?.id ??
          prev?.user_id,
      }));

      setForm({
        fullName: updatedUser.full_name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        role: updatedUser.role_name || '',
        avatar: updatedUser.avatar_url || '/images/user/Tom.jpg',
        bio: updatedUser.bio || '',
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Cập nhật thông tin thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => setMode('view');

  //Đổi mật khẩu
  const handleChangePasswordSave = async ({ currentPassword, newPassword, confirmPassword }) => {
    if (!currentPassword || !newPassword) throw new Error('Vui lòng nhập đầy đủ thông tin');
    if (newPassword !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp');
    await changePassword(currentPassword, newPassword);
    // nếu thành công, thông báo và đóng dialog ở caller (form sẽ gọi onClose)
    toast.success('Mật khẩu đã được cập nhật');
    setShowChangePassword(false);
  };

  // Đổi avatar
  const handleAvatarModalSave = async ({ file, preview }) => {
    // nếu người dùng chỉ preview (không chọn file) thì cập nhật local và đóng
    if (!file) {
      if (preview) {
        setForm((prev) => ({ ...prev, avatar: preview }));
        setUser((prev) => ({ ...prev, avatar: preview }));
      }
      setShowAvatarForm(false);
      return;
    }

    const fd = new FormData();
    fd.append('avatar', file); // key required: "avatar"

    try {
      const res = await updateAvatar(fd); // trả về thông tin avatar mới
      const avatarUrl = res?.avatar_url || res?.url || preview || null;
      if (avatarUrl) {
        setForm((prev) => ({ ...prev, avatar: avatarUrl }));
        setUser((prev) => ({ ...prev, avatar: avatarUrl }));
      }
      toast.success('Ảnh đại diện đã được cập nhật');
      setShowAvatarForm(false);
    } catch (err) {
      // ném lỗi để AvatarForm (caller) hoặc AppDialog xử lý / hiển thị
      throw err;
    }
  };

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex-col sticky top-[70px] z-20 flex gap-3 p-3 bg-brand/10 backdrop-blur-lg rounded-md">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </div>
      </div>

      {/* 2 columns bằng chiều cao */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-6 items-stretch">
        {/* Left column */}
        <div className="flex flex-col gap-3 h-full lg:col-span-1 ">
          {/* Avatar card */}
          <Card className="flex-1 rounded-md">
            <CardHeader className="text-center">
              <CardTitle>Ảnh đại diện</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="relative inline-block">
                <div
                  className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-muted cursor-pointer relative group"
                  onClick={() => setShowAvatarForm(true)}
                >
                  {form.avatar ? (
                    <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}

                  {/* Overlay camera icon */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">{form.fullName}</h3>
                <p className="text-muted-foreground">{form.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions card */}
          <Card className="flex-1 rounded-md">
            <CardHeader>
              <CardTitle>Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 flex flex-col justify-between h-full">
              <div className="flex-col gap-2">
                {mode === "view" ? (
                  <Button onClick={() => setMode("edit")} className="w-full" variant="actionUpdate">
                    <Edit className="h-4 w-4" />
                    <span>Chỉnh sửa thông tin</span>
                  </Button>
                ) : (
                  <div className="w-full flex items-center space-x-2">
                    <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="flex-1">
                      Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading} className="flex-1" variant="actionUpdate">
                      <Save className="h-4 w-4" />
                      <span>{isLoading ? "Đang lưu..." : "Lưu"}</span>
                    </Button>
                  </div>

                )}
                <Button variant="actionUpdate" className="w-full mt-2 " onClick={() => setShowChangePassword(true)}>
                  <Lock className="" />
                  Đổi mật khẩu
                </Button>
              </div>



            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 h-full lg:col-span-2">
          <Card className="flex-1 rounded-md">
            <CardHeader>
              <CardTitle>{mode === 'view' ? 'Thông tin chi tiết' : 'Chỉnh sửa thông tin chi tiết'}</CardTitle>
              <CardDescription>Thông tin cá nhân và liên lạc của bạn</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 flex flex-col h-full">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={form.fullName}
                      onChange={handleChange("fullName")}
                      disabled={mode === "view"}
                      className="pl-10"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Vai trò</label>
                  <div className="relative">
                    <FileUser className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={form.role}
                      disabled
                      className="bg-muted/50 pl-10"
                      placeholder="Vai trò"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange("phone")}
                      disabled={mode === "view"}
                      className="pl-10"
                      placeholder="Số điện thoại"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={form.email}
                      disabled
                      className="pl-10 bg-muted/50"
                      placeholder="Email của bạn"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Giới thiệu bản thân</label>
                <textarea
                  value={form.bio}
                  onChange={handleChange("bio")}
                  disabled={mode === "view"}
                  maxLength={500}
                  className="h-[120px] disabled:bg-muted/50 w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed resize-none"
                  placeholder="Viết vài dòng giới thiệu về bản thân..."
                />
                {mode === "edit" && (
                  <div className="text-xs text-muted-foreground text-right">
                    {form.bio.length}/500 ký tự
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AppDialog
        open={showAvatarForm}
        onClose={() => setShowAvatarForm(false)}
        title="Chỉnh sửa ảnh đại diện"
        FormComponent={AvatarForm}
        mode="edit"
        maxWidth="sm:max-w-md"
        initialAvatar={form.avatar}
        onSave={handleAvatarModalSave}
      />

      <AppDialog
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        title="Đổi mật khẩu"
        FormComponent={ChangePasswordForm}
        mode="edit"
        maxWidth="sm:max-w-md"
        onSave={handleChangePasswordSave}
      />
    </div>
  );
}

