import React, { useEffect, useState } from "react";
import {
  Instagram,
  Facebook,
  Twitter,
  Leaf,
  Recycle,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const IntroPage = ({ onContact, onViewProducts, children }) => {
  // NEW: animation visible flags [image, text, socials]
  const [visible, setVisible] = useState([false, false, false]);

  useEffect(() => {
    const timers = [];
    timers.push(
      setTimeout(
        () =>
          setVisible((v) => {
            const nv = [...v];
            nv[0] = true;
            return nv;
          }),
        80
      )
    ); // image
    timers.push(
      setTimeout(
        () =>
          setVisible((v) => {
            const nv = [...v];
            nv[1] = true;
            return nv;
          }),
        180
      )
    ); // text
    timers.push(
      setTimeout(
        () =>
          setVisible((v) => {
            const nv = [...v];
            nv[2] = true;
            return nv;
          }),
        260
      )
    ); // socials
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <section className="relative py-15">
      <div className="relative grid grid-cols-1 lg:grid-cols-2 items-center lg:gap-0 gap-6">
        {/* Left: product image */}
        <div
          className={`flex items-center justify-end pr-4 transition-all duration-500 ease-out ${
            visible[0] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: visible[0] ? "80ms" : undefined }}
        >
          <div className="shadow-2xl rounded-3xl border border-blue-100 bg-white/80">
            <img
              src="/images/products/cosmetic2.jpg"
              alt="product"
              className="w-[600px] h-[400px] object-cover rounded-3xl"
            />
          </div>
        </div>

        {/* Right: title + CTA */}
        <div
          className={`pl-4 lg:pl-6 py-6 transition-all duration-500 ease-out ${
            visible[1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: visible[1] ? "180ms" : undefined }}
        >
          <div className="max-w-lg">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-900 leading-tight">
              <span className="block uppercase text-sm tracking-[0.25em] text-blue-400">
                vegan
              </span>
              <span className="block text-4xl md:text-6xl text-blue-700">
                COSMETICS
              </span>
            </h2>

            <div className="mt-4 h-[3px] w-36 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" />

            <p className="mt-4 text-blue-700 leading-relaxed">
              CChain Beauty — Mỹ phẩm thuần chay, an toàn cho da. Khám phá các sản
              phẩm organic & plastic-free.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex items-center gap-4">
              <Button
                variant="actionDashboardDeepBlue"
                onClick={onViewProducts}
                className="p-6 text-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-cyan-600"
              >
                SHOP NOW
              </Button>

              <Button
                variant="outline"
                onClick={onContact}
                className="p-6 text-xl font-medium text-blue-700 border-blue-300 rounded-full hover:bg-blue-50"
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>

        {/* Social icons — FIXED POSITION */}
        <div
          className={`hidden lg:flex flex-col gap-4 absolute right-12 top-10 -translate-y-1/2 transition-all duration-500 ease-out ${
            visible[2] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: visible[2] ? "260ms" : undefined }}
        >
          {[Instagram, Facebook, Twitter].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="p-5 rounded-full text-blue-400 shadow-md bg-white/90 border border-blue-100 hover:shadow-xl hover:bg-blue-50 hover:text-blue-700 transition-all hover:scale-110"
            >
              <Icon size={25} />
            </a>
          ))}
        </div>
      </div>

      {/* If parent passed children (hot products preview), render here. This keeps the HOT PRODUCTS cluster visually under the IntroPage. */}
      {children ? <div className="mt-16">{children}</div> : null}

      {/* Features Section */}
      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        <div className="shadow-md text-center p-8 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white">
              <Leaf />
            </span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">
            100% Thuần Chay
          </h3>
          <p className="text-blue-700">
            Không thử nghiệm trên động vật, thành phần hoàn toàn từ thiên nhiên
          </p>
        </div>

        <div className="shadow-md text-center p-8 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white">
              <Recycle />
            </span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">Plastic-Free</h3>
          <p className="text-blue-700">
            Bao bì thân thiện môi trường, có thể tái chế 100%
          </p>
        </div>

        <div className="shadow-md text-center p-8 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white">
              <Sparkle />
            </span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">An Toàn Da</h3>
          <p className="text-blue-700">
            Kiểm nghiệm da liễu, phù hợp cho da nhạy cảm
          </p>
        </div>
      </div>

      {/* About Section */}
      <div className="mt-32 bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 text-white py-20 px-6  shadow-2xl">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-cyan-100">
            Câu Chuyện Của Chúng Tôi
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-blue-100 mb-8">
            HEAR & BODY ra đời từ niềm đam mê với vẻ đẹp tự nhiên và trách nhiệm
            với môi trường. Chúng tôi tin rằng làm đẹp không cần phải hi sinh
            động vật hay hành tinh của chúng ta.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-300">100+</div>
              <div className="text-sm mt-2 text-blue-100">Sản phẩm</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-300">5000+</div>
              <div className="text-sm mt-2 text-blue-100">Khách hàng</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-300">100%</div>
              <div className="text-sm mt-2 text-blue-100">Thuần chay</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-300">0%</div>
              <div className="text-sm mt-2 text-blue-100">Nhựa độc hại</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mt-32 max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-blue-900 mb-16">
          Khách Hàng Nói Gì
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-8 rounded-2xl shadow-xl border border-blue-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow">
                TS
              </div>
              <div className="ml-4">
                <div className="font-semibold text-blue-900">Thach Sanh</div>
                <div className="text-sm text-blue-400">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
            <p className="text-blue-700 italic">
              "Da mình nhạy cảm lắm nhưng dùng sản phẩm này thấy rất ok. Mùi
              hương tự nhiên, không gây kích ứng. Rất hài lòng!"
            </p>
          </div>

          <div className="bg-gradient-to-br from-white via-cyan-50 to-blue-50 p-8 rounded-2xl shadow-xl border border-cyan-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow">
                M
              </div>
              <div className="ml-4">
                <div className="font-semibold text-blue-900">Minh Tran</div>
                <div className="text-sm text-cyan-400">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
            <p className="text-blue-700 italic">
              "Thích nhất là bao bì không dùng nhựa. Vừa đẹp vừa thân thiện môi
              trường. Sẽ ủng hộ thương hiệu lâu dài!"
            </p>
          </div>
          <div className="bg-gradient-to-br from-white via-cyan-50 to-blue-50 p-8 rounded-2xl shadow-xl border border-cyan-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow">
                M
              </div>
              <div className="ml-4">
                <div className="font-semibold text-blue-900">Mai An Tiêm</div>
                <div className="text-sm text-cyan-400">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
            <p className="text-blue-700 italic">
              "Nhân viên chăm sóc khách hàng rất nhiệt tình và thân thiện. Sản
              phẩm giao nhanh, đóng gói cẩn thận. Mình rất hài lòng với trải
              nghiệm mua sắm tại đây."
            </p>
          </div>
          <div className="bg-gradient-to-br from-white via-cyan-50 to-blue-50 p-8 rounded-2xl shadow-xl border border-cyan-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow">
                E
              </div>
              <div className="ml-4">
                <div className="font-semibold text-blue-900">Elit</div>
                <div className="text-sm text-cyan-400">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
            <p className="text-blue-700 italic">
              "Sản phẩm rất hiệu quả và dễ sử dụng. Mình đã giới thiệu cho nhiều
              bạn bè và họ cũng rất thích. Chắc chắn sẽ tiếp tục mua hàng ở
              đây!"
            </p>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="mt-32 mb-16 max-w-4xl mx-auto px-6">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nhận Ưu Đãi Đặc Biệt
          </h2>
          <p className="text-lg mb-8 text-blue-100">
            Đăng ký ngay để nhận thông tin sản phẩm mới và giảm giá 15% cho đơn
            đầu tiên
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              variant="normal"
              type="email"
              placeholder="Email của bạn"
              className="bg-white text-slate-600"
            />
            <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full font-semibold shadow-lg">
              Đăng Ký
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroPage;
