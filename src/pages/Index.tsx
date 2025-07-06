import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import EnhancedAuthForm from "@/components/EnhancedAuthForm";
import MainChatApp from "@/components/MainChatApp";

const Index = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <MainChatApp />;
  }

  return <EnhancedAuthForm onSuccess={() => {}} />;
};

export default Index;
