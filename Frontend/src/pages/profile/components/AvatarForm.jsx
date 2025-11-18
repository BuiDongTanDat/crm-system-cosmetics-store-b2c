import React, { useState } from 'react';
import { Camera, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AvatarForm({
  initialAvatar = '/images/user/Tom.jpg',
  onSave,
  onCancel,
  onClose
}) {
  const [preview, setPreview] = useState(initialAvatar);
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
    setFile(f);
  };

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (typeof onSave === 'function') {
        // send file or preview dataURL to parent
        await onSave({ file, preview });
      } else {
        await new Promise(r => setTimeout(r, 700));
        toast.success('Ảnh đại diện cập nhật (demo)');
      }
    } catch (err) {
      toast.error(err?.message || 'Cập nhật avatar thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center min-h-0">
        <div className="w-40 h-40 rounded-full overflow-hidden bg-muted mb-4 cursor-pointer">
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        </div>

        <div className="mb-3 text-sm text-muted-foreground">Chọn ảnh mới (jpg, png)</div>

        <div className="flex gap-2">
          <Button asChild variant="actionCreate" className="inline-flex items-center gap-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <Camera className="h-4 w-4" />
              <span>Chọn file</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </label>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // reset to initial
              setPreview(initialAvatar);
              setFile(null);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="border-t bg-white p-4 flex-shrink-0 flex justify-end gap-2">
        <Button variant="outline" disabled={isSaving} onClick={() => { if (typeof onClose === 'function') onClose(); else if (typeof onCancel === 'function') onCancel(); }}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={isSaving} variant="actionUpdate">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Đang upload...' : 'Lưu'}
        </Button>
      </div>
    </div>
  );
}
