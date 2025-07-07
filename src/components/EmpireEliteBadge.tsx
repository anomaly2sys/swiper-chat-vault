import React from "react";
import { Star, Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmpireEliteBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  animated?: boolean;
}

const EmpireEliteBadge: React.FC<EmpireEliteBadgeProps> = ({
  size = "md",
  showText = true,
  animated = true,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-1";
      case "lg":
        return "text-sm px-3 py-1.5";
      default:
        return "text-xs px-2.5 py-1";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-3.5 w-3.5";
    }
  };

  return (
    <Badge
      className={`
        bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 
        text-white border-0 font-semibold
        ${getSizeClasses()}
        ${animated ? "animate-pulse" : ""}
        shadow-lg shadow-purple-500/25
        hover:shadow-purple-500/50 transition-all duration-300
      `}
    >
      <div className="flex items-center space-x-1">
        <Star className={`${getIconSize()} fill-current`} />
        {showText && <span>Empire Elite</span>}
        <Zap
          className={`${getIconSize()} fill-current ${animated ? "animate-bounce" : ""}`}
        />
      </div>
    </Badge>
  );
};

export default EmpireEliteBadge;
