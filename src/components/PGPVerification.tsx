import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Key,
  Download,
  Upload,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import {
  pgpVerificationService,
  PGPKeyPair,
} from "@/services/pgpVerificationService";

interface PGPVerificationProps {
  mode: "register" | "login" | "verify";
  onVerificationSuccess: (verification: any) => void;
  onVerificationFailure: (error: string) => void;
}

const PGPVerification: React.FC<PGPVerificationProps> = ({
  mode,
  onVerificationSuccess,
  onVerificationFailure,
}) => {
  const [step, setStep] = useState<"setup" | "verify" | "complete">("setup");
  const [keyPair, setKeyPair] = useState<PGPKeyPair | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [verificationChallenge, setVerificationChallenge] = useState("");
  const [signedMessage, setSignedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keyStrength, setKeyStrength] = useState<any>(null);

  const { toast } = useToast();

  const generateKeyPair = async () => {
    if (!passphrase) {
      toast({
        title: "Passphrase required",
        description:
          "Please enter a strong passphrase to protect your private key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const name = `SwiperEmpire User ${Date.now()}`;
      const email = `user${Date.now()}@swiperempire.local`;

      const keyPair = await pgpVerificationService.generateKeyPair(
        name,
        email,
        passphrase,
      );
      setKeyPair(keyPair);
      setPublicKey(keyPair.publicKey);
      setPrivateKey(keyPair.privateKey);

      toast({
        title: "PGP Key Pair Generated!",
        description:
          "Your cryptographic identity has been created. Save your private key securely!",
      });

      setStep("verify");
    } catch (error) {
      toast({
        title: "Key generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPublicKey = async () => {
    if (!publicKey) {
      toast({
        title: "Public key required",
        description: "Please provide your PGP public key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const verification =
        await pgpVerificationService.verifyPublicKey(publicKey);

      if (!verification.isValid) {
        throw new Error(verification.error || "Invalid public key");
      }

      const strength =
        await pgpVerificationService.validateKeyStrength(publicKey);
      setKeyStrength(strength);

      if (mode === "login") {
        const challenge =
          pgpVerificationService.generateVerificationChallenge("user");
        setVerificationChallenge(challenge);
        setStep("verify");
      } else {
        onVerificationSuccess(verification);
        setStep("complete");
      }

      toast({
        title: "Public key verified!",
        description: `Key ID: ${verification.keyId}`,
      });
    } catch (error) {
      onVerificationFailure(error.message);
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifySignature = async () => {
    if (!signedMessage || !publicKey) {
      toast({
        title: "Missing information",
        description:
          "Please provide both the signed message and your public key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await pgpVerificationService.verifySignedMessage(
        signedMessage,
        publicKey,
      );

      if (!result.isValid) {
        throw new Error(result.error || "Signature verification failed");
      }

      if (result.message.trim() !== verificationChallenge.trim()) {
        throw new Error("Challenge verification failed");
      }

      const keyVerification =
        await pgpVerificationService.verifyPublicKey(publicKey);

      onVerificationSuccess({
        ...keyVerification,
        challengeVerified: true,
      });

      toast({
        title: "Identity verified!",
        description: "PGP signature successfully validated",
      });

      setStep("complete");
    } catch (error) {
      onVerificationFailure(error.message);
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadKey = (key: string, filename: string) => {
    const blob = new Blob([key], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard",
    });
  };

  if (mode === "register" && step === "setup") {
    return (
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            PGP Identity Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Secure Passphrase</Label>
            <Input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter a strong passphrase to protect your private key"
              className="bg-gray-800 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400">
              This passphrase protects your private key. Use a strong, unique
              passphrase.
            </p>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
            <h4 className="text-blue-300 font-medium mb-2">
              🔐 PGP Verification
            </h4>
            <p className="text-sm text-gray-300">
              PGP verification provides cryptographic proof of your identity.
              Your key pair will be used for:
            </p>
            <ul className="text-xs text-gray-400 mt-2 list-disc list-inside space-y-1">
              <li>Identity verification during login</li>
              <li>End-to-end encrypted communications</li>
              <li>Digital signatures for transactions</li>
              <li>Secure escrow operations</li>
            </ul>
          </div>

          <Button
            onClick={generateKeyPair}
            disabled={isLoading || !passphrase}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating PGP Key Pair...
              </div>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Generate PGP Key Pair
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === "register" && step === "verify" && keyPair) {
    return (
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Save Your PGP Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
            <h4 className="text-red-300 font-medium mb-2">
              ⚠️ Critical Security Notice
            </h4>
            <p className="text-sm text-gray-300">
              Your private key is the only way to access your account. If you
              lose it, you cannot recover your account!
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-gray-300 mb-2 block">
                Public Key (share this)
              </Label>
              <div className="relative">
                <Textarea
                  value={keyPair.publicKey}
                  readOnly
                  className="bg-gray-800 border-gray-600 text-green-300 font-mono text-xs h-32"
                />
                <Button
                  onClick={() => copyToClipboard(keyPair.publicKey)}
                  className="absolute top-2 right-2"
                  size="sm"
                  variant="outline"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 mb-2 block">
                Private Key (keep secret!)
              </Label>
              <div className="relative">
                <Textarea
                  value={keyPair.privateKey}
                  readOnly
                  className="bg-gray-900 border-red-600 text-red-300 font-mono text-xs h-32"
                />
                <Button
                  onClick={() => copyToClipboard(keyPair.privateKey)}
                  className="absolute top-2 right-2"
                  size="sm"
                  variant="outline"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() =>
                downloadKey(keyPair.publicKey, "swiperempire-public-key.asc")
              }
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Public Key
            </Button>
            <Button
              onClick={() =>
                downloadKey(keyPair.privateKey, "swiperempire-private-key.asc")
              }
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Private Key
            </Button>
          </div>

          <Button
            onClick={() => {
              onVerificationSuccess({
                keyId: keyPair.keyId,
                fingerprint: keyPair.fingerprint,
                publicKey: keyPair.publicKey,
              });
              setStep("complete");
            }}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            I've Saved My Keys - Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === "login" && step === "setup") {
    return (
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            PGP Identity Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Your PGP Public Key</Label>
            <Textarea
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;...&#10;-----END PGP PUBLIC KEY BLOCK-----"
              className="bg-gray-800 border-gray-600 text-white font-mono text-xs h-40"
            />
          </div>

          {keyStrength && (
            <div
              className={`p-3 rounded border ${
                keyStrength.isStrong
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-yellow-500/10 border-yellow-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Key Strength</span>
                <Badge variant={keyStrength.isStrong ? "default" : "secondary"}>
                  {keyStrength.score}/100
                </Badge>
              </div>
              {keyStrength.warnings.length > 0 && (
                <ul className="text-xs space-y-1">
                  {keyStrength.warnings.map((warning, index) => (
                    <li key={index} className="flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {warning}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Button
            onClick={verifyPublicKey}
            disabled={isLoading || !publicKey}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify Public Key
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === "login" && step === "verify") {
    return (
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Sign Verification Challenge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded">
            <h4 className="text-purple-300 font-medium mb-2">
              Verification Challenge
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              Sign this challenge with your private key to prove your identity:
            </p>
            <div className="bg-gray-900 p-3 rounded font-mono text-xs text-green-300 break-all">
              {verificationChallenge}
            </div>
            <Button
              onClick={() => copyToClipboard(verificationChallenge)}
              className="mt-2"
              size="sm"
              variant="outline"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Challenge
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Signed Message</Label>
            <Textarea
              value={signedMessage}
              onChange={(e) => setSignedMessage(e.target.value)}
              placeholder="Paste your signed challenge message here..."
              className="bg-gray-800 border-gray-600 text-white font-mono text-xs h-32"
            />
            <p className="text-xs text-gray-400">
              Use your PGP client to sign the challenge message with your
              private key.
            </p>
          </div>

          <Button
            onClick={verifySignature}
            disabled={isLoading || !signedMessage}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying Signature...
              </div>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Verify Signature
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "complete") {
    return (
      <Card className="bg-black/40 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
            PGP Verification Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-green-300 mb-2">
              Cryptographic Identity Verified!
            </h3>
            <p className="text-gray-300">
              Your PGP identity has been successfully verified. You now have
              enhanced security protection.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <div className="text-sm font-medium text-green-300">
                Identity Verified
              </div>
            </div>
            <div className="text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded">
              <Lock className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <div className="text-sm font-medium text-blue-300">
                Encryption Ready
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default PGPVerification;
