import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Fingerprint, Lock, Mail, User, ChevronRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get("mode") === "signup";
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codename, setCodename] = useState("");
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const response = await api.post('/auth/register', { email, password, codename });
        if (response.data.success) {
          authLogin(response.data.token, response.data.user);
          toast.success("RECRUITMENT_SUCCESSFUL", {
            description: "Neural handshake established. Welcome to Nexus."
          });
          navigate("/dashboard");
        }
      } else {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success) {
          authLogin(response.data.token, response.data.user);
          toast.success("ACCESS_GRANTED", {
            description: "Decryption complete. Operator online."
          });
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Communication breach. Protocol failed.";
      toast.error("ENCRYPTION_ERROR", {
        description: message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background HUD Decor */}
      <div className="absolute inset-0 parallax-grid opacity-[0.2]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.03)_0%,transparent_70%)] animate-pulse" />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          className="holographic-card rounded-3xl p-10 hud-border relative"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-6 relative group cursor-crosshair">
              <Shield className={`w-10 h-10 ${loading ? "text-accent animate-pulse" : "text-primary neon-text-blue"}`} />
              {loading && <div className="absolute inset-0 border-2 border-accent border-dashed rounded-2xl animate-[spin_4s_linear_infinite]" />}
            </div>
            <h2 className="font-display text-4xl tracking-[-0.02em] font-black uppercase mb-2">
              {isSignUp ? "Create_" : "Access_"}<span className="text-primary neon-text-blue">Nexus</span>
            </h2>
            <p className="text-[10px] font-display tracking-[0.4em] text-muted-foreground uppercase">
              {loading ? "DECRYPTING_BIO_SIGNAL..." : "SECURITY_PROTOCOL_ENFORCED"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-display tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                    <User className="w-3 h-3" /> Agent_Codename
                  </label>
                  <Input 
                    value={codename}
                    onChange={(e) => setCodename(e.target.value)}
                    placeholder="VORTEX_99" 
                    className="bg-primary/5 border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary/20 h-12 font-display uppercase tracking-widest" 
                    required={isSignUp}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-display tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <Mail className="w-3 h-3" /> Neural_Address
              </label>
              <Input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="OPERATOR@NEXUS.OS" 
                className="bg-primary/5 border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary/20 h-12 font-display uppercase tracking-widest" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-display tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <Lock className="w-3 h-3" /> Access_Key
              </label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="bg-primary/5 border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary/20 h-12 font-display tracking-widest" 
                required 
              />
            </div>

            <Button disabled={loading} className={`w-full py-8 font-display tracking-[0.3em] text-[10px] transition-all relative overflow-hidden group ${
              loading ? "bg-accent/20 text-accent border border-accent/40" : "bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-blue"
            }`}>
              <span className="relative z-10 flex items-center justify-center gap-2 uppercase">
                {loading ? "Processing_Entropy..." : isSignUp ? "Initialize_Account" : "Decrypt_Access"}
                {!loading && <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />}
              </span>
              {!loading && <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
              {loading && <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-accent/20" />}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-border/30 text-center">
            <button
              onClick={() => navigate(isSignUp ? "/auth" : "/auth?mode=signup")}
              className="text-[10px] font-display tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors uppercase"
            >
              {isSignUp ? "Already_Enlisted? Login_Protocol" : "New_Recruit? Request_Access"}
            </button>
          </div>

          {/* Decorative scanner effect at bottom */}
          <div className="mt-8 flex justify-center gap-6 opacity-30">
            <Fingerprint className="w-5 h-5" />
            <Activity className="w-5 h-5 animate-pulse" />
            <Zap className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Tactical Footer */}
        <div className="mt-8 text-center space-y-2">
          <div className="text-[8px] font-display tracking-[0.5em] text-muted-foreground uppercase">Encryption_Standard: AES_256_QUANTUM</div>
          <div className="text-[8px] font-display tracking-[0.5em] text-primary/40 uppercase">Connection_Secure // IP_HIDDEN</div>
        </div>
      </div>
    </div>
  );
}
