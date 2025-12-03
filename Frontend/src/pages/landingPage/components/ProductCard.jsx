import React from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { formatCurrency } from "@/utils/helper";


const Rating = ({ value = 0 }) => {
    const full = Math.floor(value);
    const half = value - full >= 0.5;
    const stars = Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (i === full && half);
        return (
            <Star
                key={i}
                size={14}
                className={`shrink-0 ${filled ? "fill-yellow-400" : "fill-transparent"} stroke-yellow-500`}
            />
        );
    });
    return (
        <div className="flex items-center gap-0.5">
            {stars}
            <span className="ml-1 text-xs text-gray-600">{Number(value || 0).toFixed(1)}</span>
        </div>
    );
};

const ProductCard = ({ p, onInterest, onOrder }) => {
    // Map API fields
    const id = p.product_id ?? p.id;
    const name = p.name;
    const image = p.image || "/images/products/product_temp.png";
    const brand = p.brand;
    const category = p.category;
    const shortDesc = p.short_description || "";
    const currentPrice = Number(p.price_current ?? p.currentPrice ?? 0);
    const originalPrice = Number(p.price_original ?? p.originalPrice ?? 0);
    const discount = Number(p.discount_percent ?? (originalPrice && originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0));
    const rating = Number(p.rating ?? 0);
    const inventory = Number(p.inventory_qty ?? p.inventory ?? 0);
    const statusRaw = (p.status || "").toString().toUpperCase();

    // Determine stock state
    const outOfStock = inventory <= 0 || ["OUT_OF_STOCK", "SOLD_OUT", "UNAVAILABLE"].includes(statusRaw);
    const statusLabel = (() => {
        if (inventory > 0 && statusRaw === "AVAILABLE") return "Còn hàng";
        if (["COMING_SOON", "PREORDER", "SCHEDULED"].includes(statusRaw)) return "Sắp về";
        if (outOfStock) return "Hết hàng";
        return p.status || "";
    })();

    return (
        <div className={`rounded-sm border bg-white shadow-sm overflow-hidden flex flex-col hover:scale-102 hover:shadow-lg transition-transform duration-200 animate-fadeIn`}>
            <div className="relative h-48 bg-gray-50">
                <img
                    src={image}
                    onError={(e) => (e.currentTarget.src = "/images/placeholder-product.jpg")}
                    alt={name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
                {discount > 0 && (
                    <span className="absolute top-0 left-0 rounded-br-sm  bg-rose-500  text-white text-[15px] font-semibold px-6 py-1 shadow">
                        -{discount}%
                    </span>
                )}

            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <Rating value={rating} />
                    <div>
                        {p.inventory_qty !== undefined && (
                            <span
                                className={`rounded-full px-2.5 py-1 text-[12px] font-medium backdrop-blur border ${p.inventory_qty > 0
                                    ? "bg-cyan-50/80 text-blue-700 border-cyan-200"
                                    : "bg-rose-50/80 text-rose-700 border-rose-200"
                                    }`}
                            >
                                {p.inventory_qty > 0 ? `Còn hàng (${p.inventory_qty})` : "Hết hàng"}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{name}</h3>
                </div>

                <p className="mt-1 text-[13px] text-gray-500 line-clamp-2">
                    {(category ? `${category}` : "") + (brand ? ` - ${brand}` : "")}
                </p>

                {shortDesc && <p className=" text-[12px] text-gray-500 line-clamp-2">{shortDesc}</p>}
                <div className="text-right">
                    {originalPrice && originalPrice > currentPrice && (
                        <div className="text-[12px] text-gray-400 line-through">
                            {formatCurrency(originalPrice)}
                        </div>
                    )}
                    <div className="text-base font-bold text-gray-900">
                        {formatCurrency(currentPrice)}
                    </div>
                </div>




                <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        className="h-9 text-sm"
                        onClick={() => onInterest?.(p)}>
                        <Star size={14} className="mr-1" /> Quan tâm
                    </Button>
                    <Button
                        variant="actionCreate"
                        className="h-9 text-sm"
                        // tại nó cũng tương tự
                        onClick={() => onInterest?.(p)}
                        disabled={outOfStock}>
                        Đặt hàng
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
