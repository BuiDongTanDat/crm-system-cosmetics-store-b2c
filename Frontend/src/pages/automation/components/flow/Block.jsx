export const Block = ({ icon: Icon, label, active, onClick, right, muted }) => (
  <div
    onClick={onClick}
    className={
      "w-full flex items-center justify-between px-3 py-3 mb-2 rounded-xl border text-left transition " +
      (active
        ? "border-brand bg-brand-50 "
        : "border-gray-200 hover:border-brand") +
      (muted ? " opacity-70" : "")
    }
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-brand" />
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