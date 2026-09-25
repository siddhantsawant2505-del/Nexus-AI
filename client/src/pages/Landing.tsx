import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ChevronRight, Activity, Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Activity, title: "Computer Vision", desc: "Real-time form tracking with AI skeletal overlays" },
  { icon: Brain, title: "Adaptive AI", desc: "Workouts that evolve with your performance DNA" },
  { icon: Shield, title: "Gamified Progress", desc: "RPG-style leveling, leaderboards & achievements" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 data-grid-overlay pointer-events-none" />
      
      {/* Subtle Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="w-full h-px bg-primary scanning-line" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="relative">
            <Zap className="w-8 h-8 text-primary transition-all" />
          </div>
          <span className="font-display text-xl tracking-[0.3em] text-technical-slate uppercase font-black">Nexus_Fit</span>
        </div>
        <div className="flex gap-4">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="font-display tracking-[0.2em] text-[10px] text-muted-foreground hover:text-primary">
              ACCESS_LOGIN
            </Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button size="sm" className="font-display tracking-[0.2em] text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 px-6 bold-border">
              ENLIST_RECRUIT
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 md:pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl relative"
        >
          <div className="inline-flex items-center gap-3 bg-secondary/10 border-2 border-secondary/20 rounded-none px-5 py-2 mb-10">
            <div className="w-2 h-2 bg-secondary animate-pulse" />
            <span className="text-[10px] font-display tracking-[0.3em] uppercase text-secondary font-bold">
              SYSTEM_STATUS: BIO_SYNC_ACTIVE
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-8 uppercase text-technical-slate">
            Transcend<br />
            <span className="text-primary inline-block mt-2">Your_Limits</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-body font-medium">
            Molecular-precision computer vision fused with adaptive bio-feedback.
            Initialize your performance evolution with the <span className="text-technical-slate font-bold">Nexus Performance OS</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            <Link to="/lab">
              <Button size="lg" className="font-display tracking-[0.2em] text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-8 bold-border group">
                <span className="relative z-10 flex items-center gap-2">
                  INITIALIZE_LAB <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg" className="font-display tracking-[0.2em] text-xs border-2 border-technical-slate/20 text-technical-slate hover:bg-technical-slate/5 px-10 py-8">
                VIEW_TELEMETRY
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Tactical HUD Overlays - Simplified & High Contrast */}
        <div className="absolute inset-0 pointer-events-none hidden xl:block">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-[5%]"
          >
            <div className="flat-card w-48 bg-white border-technical-slate">
              <div className="flex justify-between items-center mb-3">
                <div className="technical-readout">BIO_SIGNAL</div>
                <Activity className="w-3 h-3 text-primary animate-pulse" />
              </div>
              <div className="text-4xl font-display text-technical-slate mb-1">142</div>
              <div className="text-[10px] font-display text-muted-foreground font-bold">BPM_INTENSITY</div>
              <div className="mt-4 h-2 w-full bg-slate-100 border border-slate-200">
                <motion.div 
                   animate={{ width: ["20%", "80%", "40%", "90%"] }} 
                   transition={{ duration: 2, repeat: Infinity }}
                   className="h-full bg-primary" 
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-1/3 right-[5%]"
          >
            <div className="flat-card w-48 bg-white border-secondary">
              <div className="flex justify-between items-center mb-3">
                <div className="technical-readout text-secondary">SYNAPSE_LOAD</div>
                <Brain className="w-3 h-3 text-secondary" />
              </div>
              <div className="text-4xl font-display text-secondary mb-1">94.8%</div>
              <div className="text-[10px] font-display text-muted-foreground font-bold">AI_SYNERGY</div>
              <div className="intensity-indicator mt-4 w-fit">OPTIMIZED</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grids */}
      <section className="relative z-10 px-6 md:px-12 pb-32">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
              className="flat-card group border-technical-slate/10 hover:border-primary transition-all cursor-crosshair bg-white"
            >
              <div className="w-12 h-12 bg-slate-50 flex items-center justify-center mb-6 border-2 border-technical-slate/5 group-hover:border-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-technical-slate group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-display text-sm tracking-[0.2em] uppercase text-technical-slate font-black mb-4">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body font-medium">
                {f.desc}
              </p>
              <div className="mt-8 flex items-center justify-between">
                <span className="technical-readout opacity-30">MOD_0{i+1}</span>
                <div className="w-8 h-1 bg-slate-100 group-hover:bg-primary transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
