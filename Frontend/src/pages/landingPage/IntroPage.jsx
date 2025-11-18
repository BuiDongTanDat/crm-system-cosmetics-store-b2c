import React, { useEffect, useState } from "react";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

const IntroPage = ({ onContact, onViewProducts, children }) => { // added children
    // NEW: animation visible flags [image, text, socials]
    const [visible, setVisible] = useState([false, false, false]);

    useEffect(() => {
        const timers = [];
        timers.push(setTimeout(() => setVisible(v => { const nv = [...v]; nv[0] = true; return nv; }), 80));  // image
        timers.push(setTimeout(() => setVisible(v => { const nv = [...v]; nv[1] = true; return nv; }), 180)); // text
        timers.push(setTimeout(() => setVisible(v => { const nv = [...v]; nv[2] = true; return nv; }), 260)); // socials
        return () => timers.forEach(t => clearTimeout(t));
    }, []);

    return (
        <section className="relative py-15">
            <div className="relative grid grid-cols-1 lg:grid-cols-2 items-center lg:gap-0 gap-6">

                {/* Left: product image */}
                <div
                    className={`flex items-center justify-end pr-4 transition-all duration-500 ease-out ${visible[0] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                        }`}
                    style={{ transitionDelay: visible[0] ? "80ms" : undefined }}
                >
                    <div className="shadow-lg">
                        <img
                            src="/images/products/cosmetic2.jpg"
                            alt="product"
                            className="w-[600px] h-[400px] object-cover"
                        />
                    </div>

                </div>

                {/* Right: title + CTA */}
                <div
                    className={`pl-4 lg:pl-6 py-6 transition-all duration-500 ease-out ${visible[1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                        }`}
                    style={{ transitionDelay: visible[1] ? "180ms" : undefined }}
                >
                    <div className="max-w-lg">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-800 leading-tight">
                            <span className="block uppercase text-sm tracking-[0.25em] text-gray-400">
                                vegan
                            </span>
                            <span className="block text-4xl md:text-6xl">COSMETICS</span>
                        </h2>

                        <div className="mt-4 h-[3px] w-36 bg-blue-500 rounded-full" />

                        <p className="mt-4 text-gray-600 leading-relaxed">
                            HEAR & BODY — Mỹ phẩm thuần chay, an toàn cho da.
                            Khám phá các sản phẩm organic & plastic-free.
                        </p>

                        {/* CTAs */}
                        <div className="mt-6 flex items-center gap-4">
                            <Button
                                variant="actionDashboardDeepBlue"
                                onClick={onViewProducts}
                                className="p-6 text-xl"
                            >
                                SHOP NOW
                            </Button>

                            <Button
                                variant="outline"
                                onClick={onContact}
                                className="p-6 text-xl font-medium text-gray-700"
                            >
                                Learn more
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Social icons — FIXED POSITION */}
                <div
                    className={`hidden lg:flex flex-col gap-4 absolute right-12 top-10 -translate-y-1/2 transition-all duration-500 ease-out ${visible[2] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                        }`}
                    style={{ transitionDelay: visible[2] ? "260ms" : undefined }}
                >
                    {[Instagram, Facebook, Twitter].map((Icon, i) => (
                        <a
                            key={i}
                            href="#"
                            className="p-5 rounded-full text-gray-400 shadow-sm hover:shadow-md hover:bg-white hover:text-gray-800 
                    transition-all hover:scale-110"
                        >
                            <Icon size={25} />
                        </a>
                    ))}
                </div>
            </div>

            {/* If parent passed children (hot products preview), render here.
                This keeps the HOT PRODUCTS cluster visually under the IntroPage. */}
            {children ? (
                <div id="intro-hot-products" className="max-w-6xl mx-auto mt-10 px-4 sm:px-6">
                    {children}
                </div>
            ) : null}
        </section>

    );
};

export default IntroPage;
