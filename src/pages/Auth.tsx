import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, Mail, Shield, Download, Copy, Check } from "lucide-react";

type AuthStep = "email" | "check-email" | "keypair-generated";

interface KeypairData {
  public_key: string;
  private_key: string;
}

const Auth = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>("email");
  const [keypairData, setKeypairData] = useState<KeypairData | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has keypair
        const { data: keypair } = await supabase
          .from("user_keypairs")
          .select("public_key")
          .eq("user_id", session.user.id)
          .single();
        
        if (keypair) {
          navigate("/");
        } else {
          // Generate keypair for existing user
          await generateKeypair();
        }
      }
    };
    checkUser();

    // Listen for auth changes (magic link callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Check if user already has keypair
          const { data: keypair } = await supabase
            .from("user_keypairs")
            .select("public_key")
            .eq("user_id", session.user.id)
            .single();
          
          if (keypair) {
            navigate("/");
          } else {
            // Generate keypair for new user
            await generateKeypair();
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const generateKeypair = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-keypair");
      
      if (error) throw error;
      
      setKeypairData({
        public_key: data.public_key,
        private_key: data.private_key,
      });
      setStep("keypair-generated");
      
      toast({
        title: "Identity Created",
        description: "Your WireGuard keypair has been generated. Save your private key!",
      });
    } catch (error) {
      console.error("Keypair generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate keypair. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;

      setStep("check-email");
      toast({
        title: "Check your email",
        description: "We sent you a magic link to sign in.",
      });
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send magic link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPrivateKey = async () => {
    if (keypairData?.private_key) {
      await navigator.clipboard.writeText(keypairData.private_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied", description: "Private key copied to clipboard" });
    }
  };

  const downloadPrivateKey = () => {
    if (keypairData?.private_key) {
      const blob = new Blob([keypairData.private_key], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wireguard-private-key.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleContinue = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">D-Bus Monitor</CardTitle>
          <CardDescription>
            {step === "email" && "Sign in with your email to continue"}
            {step === "check-email" && "Check your inbox for the magic link"}
            {step === "keypair-generated" && "Your identity has been created"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                A WireGuard keypair will be generated as your identity
              </p>
            </form>
          )}

          {step === "check-email" && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>. Click the link in your email to sign in.
              </p>
              <Button
                variant="outline"
                onClick={() => setStep("email")}
                className="w-full"
              >
                Use a different email
              </Button>
            </div>
          )}

          {step === "keypair-generated" && keypairData && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Public Key</Label>
                  <p className="font-mono text-xs break-all">{keypairData.public_key}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Private Key</Label>
                  <p className="font-mono text-xs break-all">{keypairData.private_key}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={copyPrivateKey}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy Key
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={downloadPrivateKey}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Save your private key now. It cannot be recovered later.
                </p>
              </div>

              <Button onClick={handleContinue} className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
