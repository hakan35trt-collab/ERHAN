import React from "react";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Shield, Crown, Trophy, Zap, Flame, Sparkles, TrendingUp, Rocket } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function DayBadge({ level, hireDate, size = "sm" }) {
  // Eğer hireDate varsa, her zaman güncel hesapla
  const actualLevel = hireDate 
    ? differenceInDays(new Date(), new Date(hireDate)) + 1 
    : level || 1;

  // Günlük renk döngüsü - her gün farklı renk
  const getDailyColor = (days) => {
    const colors = [
      { bg: "from-red-500 to-rose-600", glow: "shadow-red-500/60" },
      { bg: "from-orange-500 to-amber-600", glow: "shadow-orange-500/60" },
      { bg: "from-yellow-500 to-amber-500", glow: "shadow-yellow-500/60" },
      { bg: "from-green-500 to-emerald-600", glow: "shadow-green-500/60" },
      { bg: "from-teal-500 to-cyan-600", glow: "shadow-teal-500/60" },
      { bg: "from-blue-500 to-indigo-600", glow: "shadow-blue-500/60" },
      { bg: "from-purple-500 to-violet-600", glow: "shadow-purple-500/60" },
      { bg: "from-pink-500 to-rose-600", glow: "shadow-pink-500/60" },
      { bg: "from-fuchsia-500 to-pink-600", glow: "shadow-fuchsia-500/60" },
      { bg: "from-indigo-500 to-purple-600", glow: "shadow-indigo-500/60" }
    ];
    return colors[days % 10];
  };

  const getRankInfo = (days) => {
    const dailyColor = getDailyColor(days);
    
    let rankInfo = {
      className: `bg-gradient-to-r ${dailyColor.bg} text-white shadow-md`,
      icon: <Award className="w-3 h-3 text-white" />,
      rankName: "Yeni",
      rankEmoji: "🆕",
      glowColor: dailyColor.glow
    };

    // Her 100 güne bir renk değişimi - Daha modern gradient'ler
    if (days >= 3650) { // 10+ yıl (3650+ gün)
      rankInfo = {
        className: "bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-xl animate-pulse",
        icon: <Sparkles className="w-3 h-3 text-white animate-spin" />,
        rankName: "Efsane",
        rankEmoji: "👑",
        glowColor: "shadow-purple-600/80"
      };
    } else if (days >= 2500) { // 2500+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-700 text-white shadow-xl",
        icon: <Trophy className="w-3 h-3 text-yellow-300" />,
        rankName: "Üstat",
        rankEmoji: "🏆",
        glowColor: "shadow-purple-500/70"
      };
    } else if (days >= 2000) { // 2000+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black shadow-xl",
        icon: <Crown className="w-3 h-3 text-black" />,
        rankName: "Usta",
        rankEmoji: "👑",
        glowColor: "shadow-amber-500/70"
      };
    } else if (days >= 1500) { // 1500+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-rose-500 via-red-500 to-red-600 text-white shadow-lg",
        icon: <Flame className="w-3 h-3 text-orange-300" />,
        rankName: "Profesyonel",
        rankEmoji: "🔥",
        glowColor: "shadow-red-500/70"
      };
    } else if (days >= 1000) { // 1000+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white shadow-lg",
        icon: <Shield className="w-3 h-3 text-yellow-200" />,
        rankName: "Uzman",
        rankEmoji: "🛡️",
        glowColor: "shadow-orange-500/60"
      };
    } else if (days >= 800) { // 800+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-500 text-black shadow-lg",
        icon: <Star className="w-3 h-3 text-orange-700" />,
        rankName: "İleri Seviye",
        rankEmoji: "⭐",
        glowColor: "shadow-yellow-500/60"
      };
    } else if (days >= 600) { // 600+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white shadow-lg",
        icon: <Zap className="w-3 h-3 text-yellow-200" />,
        rankName: "Deneyimli",
        rankEmoji: "⚡",
        glowColor: "shadow-blue-500/60"
      };
    } else if (days >= 500) { // 500+ gün - KIRMIZI
      rankInfo = {
        className: "bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white shadow-lg",
        icon: <Rocket className="w-3 h-3 text-yellow-200" />,
        rankName: "Tecrübeli",
        rankEmoji: "🚀",
        glowColor: "shadow-red-500/60"
      };
    } else if (days >= 400) { // 400+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white shadow-md",
        icon: <TrendingUp className="w-3 h-3 text-green-200" />,
        rankName: "Gelişen",
        rankEmoji: "📈",
        glowColor: "shadow-emerald-500/50"
      };
    } else if (days >= 300) { // 300+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 text-white shadow-md",
        icon: <Award className="w-3 h-3 text-teal-200" />,
        rankName: "Aktif",
        rankEmoji: "💪",
        glowColor: "shadow-teal-500/50"
      };
    } else if (days >= 200) { // 200+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md",
        icon: <Star className="w-3 h-3 text-yellow-300" />,
        rankName: "Kararlı",
        rankEmoji: "💎",
        glowColor: "shadow-indigo-500/50"
      };
    } else if (days >= 100) { // 100+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white shadow-md",
        icon: <Shield className="w-3 h-3 text-blue-200" />,
        rankName: "Bağlı",
        rankEmoji: "🎯",
        glowColor: "shadow-blue-500/50"
      };
    } else if (days >= 50) { // 50+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white shadow-md",
        icon: <Award className="w-3 h-3 text-green-200" />,
        rankName: "Başlangıç",
        rankEmoji: "🌱",
        glowColor: "shadow-green-500/40"
      };
    } else if (days >= 30) { // 30+ gün
      rankInfo = {
        className: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md",
        icon: <Award className="w-3 h-3 text-cyan-200" />,
        rankName: "Adım",
        rankEmoji: "👣",
        glowColor: "shadow-cyan-500/40"
      };
    }
    
    return rankInfo;
  };

  const rankInfo = getRankInfo(actualLevel);
  const badgeSize = size === "lg" ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5";

  return (
    <div className="flex items-center space-x-1">
      <Badge className={`${rankInfo.className} ${rankInfo.glowColor} font-bold ${badgeSize} border-0 flex items-center gap-1.5 transition-all duration-300 hover:scale-105`}>
        {rankInfo.icon}
        <span className="flex items-center gap-1">
          <span>{rankInfo.rankEmoji}</span>
          <span className="font-extrabold">{rankInfo.rankName}</span>
        </span>
        <span className="ml-1 px-2 py-0.5 bg-black/20 rounded-full text-[10px] font-bold backdrop-blur-sm">
          {actualLevel}
        </span>
      </Badge>
    </div>
  );
}