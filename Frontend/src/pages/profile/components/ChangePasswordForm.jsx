import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ChangePasswordForm({ mode = 'edit', onSave, onCancel, onClose }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const toggleShow = (field) => setShow(prev => ({ ...prev, [field]: !prev[field] }));

  const validate = () => {
    if (!form.currentPassword.trim()) { toast.error('Vui lòng nhập mật khẩu hiện tại'); return false; }
    if (!form.newPassword.trim()) { toast.error('Vui lòng nhập mật khẩu mới'); return false; }
    if (form.newPassword.length < 8) { toast.error('Mật khẩu mới phải >= 8 ký tự'); return false; }
    if (form.newPassword !== form.confirmPassword) { toast.error('Mật khẩu xác nhận không khớp'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      if (typeof onSave !== 'function') {
        throw new Error('Không có handler đổi mật khẩu (onSave) được cung cấp');
      }
      // delegate việc gọi API/logic cho parent
      await onSave({ currentPassword: form.currentPassword, newPassword: form.newPassword, confirmPassword: form.confirmPassword });
      // close dialog when successful
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      // show server / network message if present
      const msg = err?.response?.data?.message || err?.message || 'Cập nhật thất bại';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Mật khẩu hiện tại</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={show.current ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={handleChange('currentPassword')}
                className="pl-10 pr-10"
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button type="button" onClick={() => toggleShow('current')} className="absolute right-3 top-3">
                {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={show.new ? 'text' : 'password'}
                value={form.newPassword}
                onChange={handleChange('newPassword')}
                className="pl-10 pr-10"
                placeholder="Nhập mật khẩu mới"
              />
              <button type="button" onClick={() => toggleShow('new')} className="absolute right-3 top-3">
                {show.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={show.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className="pl-10 pr-10"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-3">
                {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
            <p className="font-medium mb-1">Yêu cầu mật khẩu:</p>
            <ul className="space-y-1">
              <li>- Tối thiểu 8 ký tự</li>
              <li>- Nên bao gồm chữ hoa, chữ thường và số</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Fixed action buttons */}
      <div className="border-t bg-white p-4 flex-shrink-0 flex justify-end gap-2">
        <Button variant="outline" onClick={() => { if (typeof onClose === 'function') onClose(); else if (typeof onCancel === 'function') onCancel(); }}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving} variant="actionUpdate">
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </div>
  );
}
