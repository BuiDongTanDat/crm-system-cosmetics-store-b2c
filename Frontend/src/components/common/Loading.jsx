import { Spinner } from "../ui/spinner";

export default function Loading({ className = "", text = "Đang tải..." }) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen w-full ${className}`}>
      <Spinner className="w-10 h-10 text-blue-500" />
      <span className="text-xl mt-2 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 bg-clip-text text-transparent animated-gradient">{text}</span>
    </div>
  );
}
