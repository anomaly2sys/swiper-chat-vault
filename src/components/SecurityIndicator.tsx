
import React from 'react';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SecurityIndicatorProps {
  isSecure: boolean;
  encryptionLevel?: 'high' | 'medium' | 'low';
}

const SecurityIndicator: React.FC<SecurityIndicatorProps> = ({ 
  isSecure, 
  encryptionLevel = 'high' 
}) => {
  const getSecurityColor = () => {
    if (!isSecure) return 'text-red-400';
    switch (encryptionLevel) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-orange-400';
      default: return 'text-green-400';
    }
  };

  const getSecurityIcon = () => {
    if (!isSecure) return <AlertTriangle className="h-4 w-4" />;
    switch (encryptionLevel) {
      case 'high': return <Shield className="h-4 w-4" />;
      case 'medium': return <Lock className="h-4 w-4" />;
      case 'low': return <Eye className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSecurityText = () => {
    if (!isSecure) return 'Insecure';
    switch (encryptionLevel) {
      case 'high': return 'Military Grade';
      case 'medium': return 'Standard';
      case 'low': return 'Basic';
      default: return 'Military Grade';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${getSecurityColor()} bg-black/20 border-current/30 flex items-center space-x-1`}
    >
      {getSecurityIcon()}
      <span className="text-xs">{getSecurityText()}</span>
    </Badge>
  );
};

export default SecurityIndicator;
