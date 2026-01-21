import React, { useEffect, useState } from "react";
import { getPublicCampaigns } from "@/services/campaign";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, DollarSign } from "lucide-react";
import Loading from "@/components/common/Loading";

function AllCampaignPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getPublicCampaigns()
            .then((res) => {
                console.log("Public campaigns response:", res);
                setCampaigns(res.items || []);
            })
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false));
        console.log("Fetched campaigns", campaigns);
    }, []);

    if (loading) return <Loading />;

    if (!campaigns.length) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 text-lg">Không có chiến dịch nào đang chạy.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className="w-full space-y-4 p-4">
                {campaigns.map((c, index) => (
                    <div
                        key={c.campaign_id}
                        className="relative w-full min-h-[50vh] overflow-hidden cursor-pointer group animate-fade-in transition duration-150 shadow-lg"
                        onClick={() => (window.location.href = `/landing/campaigns/${c.campaign_id}`)}
                    >
                        {/* Background Image with Parallax Effect */}
                        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                            <img
                                src={c.image || "/images/products/cosmetic2.jpg"}
                                alt={c.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "/images/products/cosmetic2.jpg";
                                }}
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 min-h-[50vh] flex items-end">
                            <div className="w-full px-6 md:px-12 lg:px-16 py-8 md:py-12">
                                {/* Status Badge */}
                                <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider">
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                    ĐANG DIỄN RA
                                </div>

                                {/* Campaign Title */}
                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-2 leading-tight tracking-tight">
                                    {c.name}
                                </h2>

                                {/* Campaign Description */}
                                {c.note && (
                                    <p className="text-sm md:text-base text-gray-200 mb-4 max-w-2xl font-light line-clamp-2">
                                        {c.note}
                                    </p>
                                )}

                                {/* Info Grid */}
                                <div className="flex flex-wrap gap-3 md:gap-4 mb-4">
                                    {c.start_date && (
                                        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 text-white/90">
                                            <Calendar className="w-4 h-4 text-pink-400" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400">Bắt đầu</p>
                                                <p className="text-xs font-semibold">
                                                    {new Date(c.start_date).toLocaleDateString("vi-VN")}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {c.end_date && (
                                        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 text-white/90">
                                            <Calendar className="w-4 h-4 text-purple-400" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400">Kết thúc</p>
                                                <p className="text-xs font-semibold">
                                                    {new Date(c.end_date).toLocaleDateString("vi-VN")}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {c.budget && (
                                        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 text-white/90">
                                            <DollarSign className="w-4 h-4 text-green-400" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400">Ngân sách</p>
                                                <p className="text-xs font-semibold">{c.budget.toLocaleString()}đ</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full justify-end items-end flex group-hover:opacity-100 opacity-50 transition-opacity">
                                    {/* CTA Button */}
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `/landing/campaigns/${c.campaign_id}`;
                                        }}
                                        variant="actionAI"
                                    
                                    >
                                        Xem chi tiết
                                        <ChevronRight className="ml-2 w-4 h-4 " />
                                    </Button>
                                </div>

                            </div>
                        </div>

                        {/* Campaign Number */}
                        <div className="absolute top-4 right-6 md:top-6 md:right-8 text-white/20 font-black text-5xl md:text-7xl leading-none pointer-events-none">
                            {String(index + 1).padStart(2, "0")}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AllCampaignPage;