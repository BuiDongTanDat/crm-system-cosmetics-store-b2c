
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Video, Camera, Webcam, Info } from "lucide-react";

export default function SelectStreamOptionDialog({
  open = false,
  onClose = () => {},
  onSelect = null,
  title = "Chọn hình thức stream",
  description = "Vui lòng chọn cách bạn muốn phát trực tiếp.",
}) {
  const handleSelect = (key) => {
    try {
      onClose();
    } catch (e) {}

    if (typeof onSelect === "function") {
      onSelect(key);
      return;
    }

    const map = {
      video: "/streams/youtube/vid",
      cam: "/streams/youtube/cam",
    };
    const href = map[key] || "/";
    window.location.assign(href);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
    >
         
      <DialogContent className="sm:max-w-lg">
             
        <DialogHeader>
                 <DialogTitle className="text-foreground">{title}</DialogTitle> 
               
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
                        {description}       
          </DialogDescription>
               
        </DialogHeader>
             
        <div className="mt-4">
                 
          <div className="flex gap-4">
                     
            <button
              type="button"
              onClick={() => handleSelect("video")}
              className="cursor-pointer flex-1 border rounded-lg p-4 text-left transition hover:bg-blue-100 focus:outline-none active:scale-95 transistion "
              aria-label="Stream bằng video"
            >
                         
              <div className="flex items-center gap-3">
                                <Video className="w-10 h-10 text-sky-600 " />   
                         
                <div>
                                 
                  <div className="font-medium text-sm">Stream bằng video</div> 
                               
                  <div className="text-xs text-muted-foreground">
                    Sử dụng file video để phát trực tiếp
                  </div>
                               
                </div>
                           
              </div>
                       
            </button>
                     
            <button
              type="button"
              onClick={() => handleSelect("cam")}
              disabled={true}
              className="flex-1 border rounded-lg p-4 text-left transition focus:outline-none bg-red-100   active:scale-95 transistion"
              aria-label="Stream bằng webcam"
            >
                         
              <div className="flex items-center gap-3">
                                <Webcam className="w-10 h-10 text-rose-600" /> 
                           
                <div>
                                 
                  <div className="font-medium text-sm">Stream bằng webcam</div> 
                               
                  <div className="text-xs text-muted-foreground">
                    Phát trực tiếp từ webcam của bạn
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <i>(Tính năng đang phát triển)</i>
                  </div>
                               
                </div>
                           
              </div>
                       
            </button>
                   
          </div>
               
        </div>
        {/* Thông báo lưu ý */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            <strong>Lưu ý:</strong> Hệ thống sẽ yêu cầu đăng nhập tài khoản
            YouTube của bạn nếu chưa được xác thực. Hãy chắc chắn rằng tài khoản
            của bạn đã kích hoạt tính năng Phát trực tiếp.
          </p>
        </div>
             
        <DialogFooter className="mt-4">
                 
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
               
        </DialogFooter>
           
      </DialogContent>
       
    </Dialog>
  );
}
