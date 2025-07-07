import React from "react";
import { Crown, Shield, Star, Award, User, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EmpireEliteBadge from "./EmpireEliteBadge";

interface RoleBadgeProps {
  username: string;
  isAdmin?: boolean;
  roles?: string[];
  size?: "sm" | "md" | "lg";
}

const RoleBadge: React.FC<RoleBadgeProps> = ({
  username,
  isAdmin = false,
  roles = [],
  size = "sm",
}) => {
  // Don't show badge for system messages
  if (username === "SwiperEmpire System") {
    return (
      <Badge
        variant="secondary"
        className="bg-green-500/20 text-green-300 border-green-500/30 text-xs"
      >
        SYSTEM
      </Badge>
    );
  }

  // Admin badge
  if (isAdmin || username.toLowerCase() === "blankbank") {
    return (
      <Badge
        variant="secondary"
        className="bg-red-500/20 text-red-300 border-red-500/30 text-xs"
      >
        <Crown className="h-3 w-3 mr-1" />
        ADMIN
      </Badge>
    );
  }

  // Check for special roles
  if (roles.length > 0) {
    const primaryRole = roles[0].toLowerCase();

    // Check for Empire Elite first (highest priority)
    if (roles.some((role) => role.toLowerCase() === "empire-elite")) {
      return <EmpireEliteBadge size="sm" showText={false} />;
    }

    switch (primaryRole) {
      case "empire-elite":
        return <EmpireEliteBadge size="sm" showText={false} />;

      case "moderator":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs"
          >
            <Shield className="h-3 w-3 mr-1" />
            MOD
          </Badge>
        );

      case "vip":
      case "premium":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs"
          >
            <Star className="h-3 w-3 mr-1" />
            VIP
          </Badge>
        );

      case "verified":
        return (
          <Badge
            variant="secondary"
            className="bg-green-500/20 text-green-300 border-green-500/30 text-xs"
          >
            <Award className="h-3 w-3 mr-1" />
            VERIFIED
          </Badge>
        );

      case "bot":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs"
          >
            BOT
          </Badge>
        );

      default:
        // Show custom role name if it's not 'member' or '@everyone'
        if (primaryRole !== "member" && primaryRole !== "@everyone") {
          return (
            <Badge
              variant="secondary"
              className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs"
            >
              {primaryRole.toUpperCase()}
            </Badge>
          );
        }
    }
  }

  // Default member badge (only show for non-standard users)
  if (username !== "User" && roles.length === 0) {
    return (
      <Badge
        variant="secondary"
        className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs"
      >
        <User className="h-3 w-3 mr-1" />
        MEMBER
      </Badge>
    );
  }

  return null;
};

export default RoleBadge;
