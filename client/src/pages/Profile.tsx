import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Shield, Wind, Flame, Target, Heart, Zap, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const { user, profile } = useAuth();

  const attributeConfigs = [
    { key: "strength", label: "Strength", icon: Shield, color: "bg-primary" },
    { key: "agility", label: "Agility", icon: Wind, color: "bg-secondary" },
    { key: "endurance", label: "Endurance", icon: Flame, color: "bg-secondary" },
    { key: "accuracy", label: "Accuracy", icon: Target, color: "bg-primary" },
    { key: "recovery", label: "Recovery", icon: Heart, color: "bg-emerald-500" },
    { key: "power", label: "Power", icon: Zap, color: "bg-primary" },
  ];

  const milestones = [
    { title: "First 100 Reps", achieved: (profile?.totalMissions || 0) > 5 },
    { title: "Perfect Form Streak (10)", achieved: true },
    { title: "1000 Calories Burned", achieved: (profile?.xp || 0) > 1000 },
    { title: "30-Day Streak", achieved: (profile?.streak || 0) >= 30 },
    { title: "Elite Accuracy", achieved: (profile?.attributes?.accuracy || 0) > 90 },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto bg-background/50 min-h-screen">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-primary" />
            <span className="technical-readout text-primary">Biometric_Profile // V2.1</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter uppercase text-technical-slate">PLAYER_<span className="text-primary">STATS</span></h1>
        </motion.div>

        {/* Player Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flat-card bg-white border-technical-slate flex items-center gap-8"
        >
          <div className="w-24 h-24 border-4 border-primary flex items-center justify-center bg-slate-50 relative">
            <Zap className="w-10 h-10 text-primary" />
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-primary" />
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-3xl font-black tracking-tight uppercase text-technical-slate mb-1">
              {user?.codename || "AGENT_NEXUS"}
            </h2>
            <div className="technical-readout mb-4">
              Level {profile?.level || 1} • {profile?.experience || "Recruit"} • {profile?.totalMissions || 0} Missions
            </div>
            <div className="flex flex-wrap gap-3">
              {profile?.goals?.map(goal => (
                <span key={goal} className="px-3 py-1 bg-primary text-white font-display text-[10px] font-black tracking-widest uppercase border border-primary">
                  {goal}
                </span>
              ))}
              {(!profile?.goals || profile.goals.length === 0) && (
                <span className="px-3 py-1 bg-slate-100 text-muted-foreground font-display text-[10px] font-black tracking-widest uppercase border border-slate-200">
                  NO_ACTIVE_GOALS
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Attributes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {attributeConfigs.map((attr, i) => {
            const value = (profile?.attributes as any)?.[attr.key] || 0;
            return (
              <motion.div
                key={attr.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flat-card bg-white border-technical-slate/5 hover:border-primary transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <attr.icon className="w-5 h-5 text-technical-slate group-hover:text-primary transition-colors" />
                  <div className="text-2xl font-display font-black text-technical-slate">{value}</div>
                </div>
                <div className="technical-readout mb-4 group-hover:text-primary transition-colors">{attr.label}</div>
                <div className="h-2 bg-slate-100 border border-slate-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                    className={`h-full ${attr.color}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flat-card bg-white border-technical-slate shadow-none"
        >
          <h3 className="technical-readout text-technical-slate text-sm mb-6 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-primary" /> MISSION_MILESTONES
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {milestones.map(m => (
              <div key={m.title} className="flex items-center gap-4 p-4 border border-technical-slate/5 bg-slate-50/50">
                <div className={`w-3 h-3 ${m.achieved ? "bg-primary" : "bg-slate-200"}`} />
                <span className={`text-[11px] font-display font-black tracking-widest uppercase ${m.achieved ? "text-technical-slate" : "text-muted-foreground"}`}>{m.title}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
