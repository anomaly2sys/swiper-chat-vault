
import React from 'react';
import { Shield, Lock, Eye, AlertTriangle, Zap } from 'lucide-react';
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
    if (!isSecure) return 'text-red-400 border-red-400/30 bg-red-500/10';
    switch (encryptionLevel) {
      case 'high': return 'text-green-400 border-green-400/30 bg-green-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
      case 'low': return 'text-orange-400 border-orange-400/30 bg-orange-500/10';
      default: return 'text-green-400 border-green-400/30 bg-green-500/10';
    }
  };

  const getSecurityIcon = () => {
    if (!isSecure) return <AlertTriangle className="h-4 w-4" />;
    switch (encryptionLevel) {
      case 'high': return <Zap className="h-4 w-4" />;
      case 'medium': return <Lock className="h-4 w-4" />;
      case 'low': return <Eye className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getSecurityText = () => {
    if (!isSecure) return 'Compromised';
    switch (encryptionLevel) {
      case 'high': return 'Quantum-Safe';
      case 'medium': return 'Standard';
      case 'low': return 'Basic';
      default: return 'Quantum-Safe';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${getSecurityColor()} flex items-center space-x-1 transition-all hover:scale-105`}
    >
      {getSecurityIcon()}
      <span className="text-xs font-medium">{getSecurityText()}</span>
    </Badge>
  );
};

export default SecurityIndicator;
