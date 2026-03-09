import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

export default function VIPBadge({ role, showCrown = true, size = "sm" }) {
  const getVIPStyle = (role) => {
    switch (role) {
      case 'admin':
        return {
          className: "bg-gradient-to-r from-purple-500 to-purple-700 text-white border-purple-300",
          text: "ADMIN",
          crownColor: "text-yellow-400"
        };
      case 'vip-3':
        return {
          className: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black border-yellow-300",
          text: "VIP-3",
          crownColor: "text-yellow-600"
        };
      case 'vip-2':
        return {
          className: "bg-gradient-to-r from-red-500 to-red-700 text-white border-red-300",
          text: "VIP-2",
          crownColor: "text-red-400"
        };
      case 'vip-1':
        return {
          className: "bg-gradient-to-r from-blue-500 to-blue-700 text-white border-blue-300",
          text: "VIP-1",
          crownColor: "text-blue-400"
        };
      default:
        return {
          className: "bg-gray-500 text-white border-gray-300",
          text: "USER",
          crownColor: "text-gray-400"
        };
    }
  };

  const vipStyle = getVIPStyle(role);
  const shouldShowCrown = showCrown && (role === 'admin' || role === 'vip-3');

  return (
    <div className="flex items-center space-x-1">
      <Badge className={`${vipStyle.className} font-bold ${size === "lg" ? "text-sm px-3 py-1" : "text-xs px-2 py-1"}`}>
        {vipStyle.text}
      </Badge>
      {shouldShowCrown && (
        <Crown className={`${size === "lg" ? "w-5 h-5" : "w-4 h-4"} ${vipStyle.crownColor}`} />
      )}
    </div>
  );
}