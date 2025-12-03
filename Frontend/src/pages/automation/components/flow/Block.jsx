export const Block = ({ icon: Icon, label, active, onClick, right, muted }) => (
  <div
    onClick={onClick}
    className={
      // small outer border by default; hover shows brand border; active shows subtle brand background + brand border
      "cursor-pointer w-full flex items-center justify-between px-3 py-3 mb-2 rounded-xl border text-left transition " +
      (active
        ? "border-brand-500 bg-brand-50 "
        : "border-brand-100 hover:border-brand-500 hover:bg-brand-50/40 ") +
      (muted ? " opacity-70" : "")
    }
  >
    <div className="flex items-center gap-3">
      {/* icon uses brand color */}
      <Icon className="w-5 h-5 text-brand-600" />
      <div>
        <div className="text-sm font-medium text-gray-900 line-clamp-1">
          {label}
        </div>
        <div className="text-xs text-gray-500 line-clamp-1">{label}</div>
      </div>
    </div>
    {right}
  </div>
);