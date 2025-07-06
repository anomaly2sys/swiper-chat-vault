import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import EnhancedAuthForm from "@/components/EnhancedAuthForm";
import EnhancedMainApp from "@/components/EnhancedMainApp";

const Index = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <MainChatApp />;
  }

  return <EnhancedAuthForm onSuccess={() => {}} />;
};

export default Index;
