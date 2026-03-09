import React from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Zap, Moon, Sun, Award } from "lucide-react";

export default function BadgeDisplay({ badges = [], size = "sm" }) {
  if (!badges || badges.length === 0) return null;

  const getBadgeIcon = (type) => {
    switch (type) {
      case "top_1": return <Trophy className="w-3 h-3 text-yellow-300" />;
      case "top_2": return <Medal className="w-3 h-3 text-gray-300" />;
      case "top_3": return <Medal className="w-3 h-3 text-amber-600" />;
      case "monthly_champion": return <Star className="w-3 h-3 text-yellow-300" />;
      case "weekly_star": return <Zap className="w-3 h-3 text-yellow-300" />;
      case "night_owl": return <Moon className="w-3 h-3 text-purple-300" />;
      case "early_bird": return <Sun className="w-3 h-3 text-orange-300" />;
      default: return <Award className="w-3 h-3 text-white" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case "top_1": return "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 text-black border-2 border-yellow-300";
      case "top_2": return "bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 text-white border-2 border-gray-300";
      case "top_3": return "bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white border-2 border-amber-500";
      case "monthly_champion": return "bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white border-2 border-purple-400";
      case "weekly_star": return "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white border border-cyan-400";
      case "night_owl": return "bg-gradient-to-r from-purple-800 via-indigo-900 to-black text-white border border-purple-600";
      case "early_bird": return "bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-500 text-black border border-orange-300";
      default: return "bg-gradient-to-r from-gray-600 to-gray-700 text-white border border-gray-500";
    }
  };

  const badgeSize = size === "lg" ? "text-xs px-3 py-1.5" : "text-[10px] px-2 py-1";

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.filter(b => b.is_active).map((badge, index) => (
        <Badge 
          key={index}
          className={`${getBadgeColor(badge.badge_type)} ${badgeSize} font-bold shadow-lg hover:scale-110 transition-all duration-200 cursor-help`}
          title={badge.description || badge.title}
        >
          {getBadgeIcon(badge.badge_type)}
          <span className="ml-1">{badge.icon}</span>
        </Badge>
      ))}
    </div>
  );
}