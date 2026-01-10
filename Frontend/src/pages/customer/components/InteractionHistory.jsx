import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Users, MessageCircle, User, ArrowLeft } from "lucide-react";
import { formatDateTimeSeparate, } from "@/utils/helper";
import { getCustomerInteractions } from "@/services/customers";

const InteractionTypes = {
  Call: "Cuộc gọi",
  Email: "Email",
  Meeting: "Cuộc họp",
  Chat: "Chat",
  "Social Media": "Mạng xã hội"
};

const getInteractionIcon = (type) => {
  switch (type) {
    case "Call": return <Phone className="w-4 h-4" />;
    case "Email": return <Mail className="w-4 h-4" />;
    case "Meeting": return <Users className="w-4 h-4" />;
    case "Chat": return <MessageCircle className="w-4 h-4" />;
    case "Social Media": return <MessageCircle className="w-4 h-4" />;
    default: return <MessageCircle className="w-4 h-4" />;
  }
};

export function InteractionHistory({ customerId, customerName, onBack }) {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInteractions = async () => {
      if (!customerId) return;
      setLoading(true);
      try {
        const res = await getCustomerInteractions(customerId);
        setInteractions(res?.data || res || []);
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử tương tác:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [customerId]);


  if (loading) {
    return (
      <div className="flex flex-col h-[70vh]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh]">

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {interactions.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Chưa có lịch sử tương tác nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction) => {
              const { date, time } = formatDateTimeSeparate(interaction.dateTime);
              return (
                <div key={interaction.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      {getInteractionIcon(interaction.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {InteractionTypes[interaction.type] || interaction.type}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{date} lúc {time}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                        {interaction.content}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Thực hiện: {interaction.employeeName}</span>
                        </div>
                        {interaction.contactName && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Liên hệ: {interaction.contactName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Tổng cộng: {interactions.length} tương tác
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InteractionHistory;
