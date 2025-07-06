
import React, { useState } from 'react';
import { MessageCircle, Shield, Lock, Eye, EyeOff, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChatInterface from '@/components/ChatInterface';
import SecurityIndicator from '@/components/SecurityIndicator';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = () => {
    if (username.trim()) {
      setIsLoggedIn(true);
    }
  };

  if (isLoggedIn) {
    return <ChatInterface username={username} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-3xl"></div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <MessageCircle className="h-10 w-10 text-purple-400" />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Swiper Chat</h1>
                <p className="text-purple-300 text-sm">Zero-Knowledge. Maximum Privacy.</p>
              </div>
            </div>
          </div>

          {/* Security Features Banner */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              <Lock className="h-3 w-3 mr-1" />
              End-to-End Encrypted
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Zero Logs
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Eye className="h-3 w-3 mr-1" />
              Disappearing Messages
            </Badge>
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
              <Users className="h-3 w-3 mr-1" />
              Mutual Consent
            </Badge>
          </div>

          {/* Auth Card */}
          <div className="max-w-md mx-auto">
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-white">
                  {isSignUp ? 'Join Swiper Chat' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {isSignUp 
                    ? 'Create your secure identity' 
                    : 'Enter your secure space'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Choose username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                  />
                </div>
                
                <Button 
                  onClick={handleAuth}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  disabled={!username.trim()}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isSignUp ? 'Create Account' : 'Enter Chat'}
                </Button>

                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full text-sm text-purple-300 hover:text-purple-200 transition-colors"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Security Promise */}
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Our Security Promise</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="bg-black/20 p-4 rounded-lg border border-gray-700">
                <Shield className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p><strong>Zero Knowledge Architecture:</strong> We can't read your messages even if we wanted to</p>
              </div>
              <div className="bg-black/20 p-4 rounded-lg border border-gray-700">
                <Lock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p><strong>Mutual Consent Storage:</strong> Messages only saved with both users' permission</p>
              </div>
              <div className="bg-black/20 p-4 rounded-lg border border-gray-700">
                <Eye className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p><strong>Disappearing by Default:</strong> Messages vanish unless explicitly saved</p>
              </div>
              <div className="bg-black/20 p-4 rounded-lg border border-gray-700">
                <Users className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <p><strong>No Backdoors:</strong> Designed to be impossible to compromise</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
