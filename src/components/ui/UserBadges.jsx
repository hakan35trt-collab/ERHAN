import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Crown, Award, Medal, Flame, Zap, Target } from 'lucide-react';

export default function UserBadges({ badges, size = "md" }) {
  if (!badges || badges.length === 0) return null;

  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1";

  const getBadgeStyle = (badge) => {
    switch (badge.color) {
      case 'gold':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black border-2 border-yellow-300 shadow-lg shadow-yellow-500/50';
      case 'silver':
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-2 border-gray-300 shadow-md shadow-gray-400/50';
      case 'bronze':
        return 'bg-gradient-to-r from-orange-600 to-orange-700 text-white border-2 border-orange-400 shadow-md shadow-orange-500/50';
      case 'blue':
        return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-2 border-blue-400 shadow-md shadow-blue-500/50';
      case 'green':
        return 'bg-gradient-to-r from-green-600 to-green-700 text-white border-2 border-green-400 shadow-md shadow-green-500/50';
      case 'purple':
        return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-2 border-purple-400 shadow-md shadow-purple-500/50';
      case 'red':
        return 'bg-gradient-to-r from-red-600 to-red-700 text-white border-2 border-red-400 shadow-md shadow-red-500/50';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white border-2 border-gray-400';
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.map((badge, index) => (
        <Badge 
          key={index}
          className={`${getBadgeStyle(badge)} ${sizeClass} font-bold flex items-center gap-1 hover:scale-110 transition-transform duration-200`}
          title={badge.name}
        >
          <span>{badge.icon}</span>
          {size !== "sm" && <span className="text-xs">{badge.name}</span>}
        </Badge>
      ))}
    </div>
  );
}