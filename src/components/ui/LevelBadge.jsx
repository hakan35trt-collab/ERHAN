import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function LevelBadge({ level, size = "sm" }) {
  const getLevelStyle = (level) => {
    const levelTier = Math.floor((level - 1) / 10);
    const colors = [
      "bg-gradient-to-r from-gray-400 to-gray-600", // 1-10
      "bg-gradient-to-r from-green-400 to-green-600", // 11-20
      "bg-gradient-to-r from-blue-400 to-blue-600", // 21-30
      "bg-gradient-to-r from-purple-400 to-purple-600", // 31-40
      "bg-gradient-to-r from-pink-400 to-pink-600", // 41-50
      "bg-gradient-to-r from-yellow-400 to-yellow-600", // 51-60
      "bg-gradient-to-r from-orange-400 to-orange-600", // 61-70
      "bg-gradient-to-r from-red-400 to-red-600", // 71-80
      "bg-gradient-to-r from-indigo-400 to-indigo-600", // 81-90
      "bg-gradient-to-r from-cyan-400 to-cyan-600", // 91-100
    ];
    
    return {
      className: `${colors[Math.min(levelTier, colors.length - 1)]} text-white border-0`,
      starCount: Math.min(Math.floor((level - 1) / 20) + 1, 5)
    };
  };

  const levelStyle = getLevelStyle(level);

  return (
    <div className="flex items-center space-x-1">
      <Badge className={`${levelStyle.className} font-bold ${size === "lg" ? "text-sm px-3 py-1" : "text-xs px-2 py-1"}`}>
        GÜN {level}
      </Badge>
      <div className="flex">
        <Calendar className={`${size === "lg" ? "w-4 h-4" : "w-3 h-3"} text-yellow-400`} />
      </div>
    </div>
  );
}