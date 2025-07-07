import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type RoleType = "owner" | "admin" | "moderator" | "verified-vendor" | "vendor" | "empire-elite" | "member";

export interface PermissionConfig {
  canCreateChannels: boolean;
  canDeleteChannels: boolean;
  canCreateShopChannels: boolean;
  canManageServer: boolean;
  canBanUsers: boolean;
  canKickUsers: boolean;
  canMuteUsers: boolean;
  canManageProducts: boolean;
  canAccessAdminPanel: boolean;
  isSiteAdmin: boolean;
}

export const usePermissions = (serverId?: string, userRole?: string): PermissionConfig => {
  const { currentUser } = useAuth();

  return useMemo(() => {
    if (!currentUser) {
      return {
        canCreateChannels: false,
        canDeleteChannels: false,
        canCreateShopChannels: false,
        canManageServer: false,
        canBanUsers: false,
        canKickUsers: false,
        canMuteUsers: false,
        canManageProducts: false,
        canAccessAdminPanel: false,
        isSiteAdmin: false,
      };
    }

    // Site admin (you) can do everything on any server
    const isSiteAdmin = currentUser.isAdmin;
    if (isSiteAdmin) {
      return {
        canCreateChannels: true,
        canDeleteChannels: true,
        canCreateShopChannels: true,
        canManageServer: true,
        canBanUsers: true,
        canKickUsers: true,
        canMuteUsers: true,
        canManageProducts: true,
        canAccessAdminPanel: true,
        isSiteAdmin: true,
      };
    }

    // Get user roles for this server
    const userRoles = JSON.parse(
      localStorage.getItem("swiperEmpire_userRoles") || "[]"
    );
    const currentUserRoles = userRoles.find(
      (ur: any) => ur.userId === currentUser.id
    );

    const roles = currentUserRoles?.roles || [];
    const isOwner = userRole === "owner";
    const isModerator = roles.includes("moderator") || userRole === "moderator";
    const isVerifiedVendor = roles.includes("verified-vendor");
    const isVendor = roles.includes("vendor");
    const isEmpireElite = roles.includes("empire-elite");

    // Owner permissions
    if (isOwner) {
      return {
        canCreateChannels: true,
        canDeleteChannels: true,
        canCreateShopChannels: true,
        canManageServer: true,
        canBanUsers: true,
        canKickUsers: true,
        canMuteUsers: true,
        canManageProducts: true,
        canAccessAdminPanel: false,
        isSiteAdmin: false,
      };
    }

    // Moderator permissions
    if (isModerator) {
      return {
        canCreateChannels: true,
        canDeleteChannels: false,
        canCreateShopChannels: isVerifiedVendor || isVendor,
        canManageServer: false,
        canBanUsers: false,
        canKickUsers: true,
        canMuteUsers: true,
        canManageProducts: isVerifiedVendor || isVendor,
        canAccessAdminPanel: false,
        isSiteAdmin: false,
      };
    }

    // Vendor permissions
    if (isVerifiedVendor || isVendor) {
      return {
        canCreateChannels: false,
        canDeleteChannels: false,
        canCreateShopChannels: true,
        canManageServer: false,
        canBanUsers: false,
        canKickUsers: false,
        canMuteUsers: false,
        canManageProducts: true,
        canAccessAdminPanel: false,
        isSiteAdmin: false,
      };
    }

    // Default member permissions
    return {
      canCreateChannels: false,
      canDeleteChannels: false,
      canCreateShopChannels: false,
      canManageServer: false,
      canBanUsers: false,
      canKickUsers: false,
      canMuteUsers: false,
      canManageProducts: false,
      canAccessAdminPanel: false,
      isSiteAdmin: false,
    };
  }, [currentUser, serverId, userRole]);
};

export const checkVendorRole = (currentUser: any): boolean => {
  if (!currentUser) return false;
  
  // Site admin can always create shop channels
  if (currentUser.isAdmin) return true;
  
  const userRoles = JSON.parse(
    localStorage.getItem("swiperEmpire_userRoles") || "[]"
  );
  const currentUserRoles = userRoles.find(
    (ur: any) => ur.userId === currentUser.id
  );
  
  return (
    currentUserRoles?.roles?.includes("vendor") ||
    currentUserRoles?.roles?.includes("verified-vendor")
  );
};