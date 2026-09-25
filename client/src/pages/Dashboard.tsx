import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Zap, Flame, Shield, Wind, Target, TrendingUp, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

function StatBar({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={`w-10 h-10 bg-white border-2 border-technical-slate/5 flex items-center justify-center group-hover:border-primary/20 transition-colors`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1.5">
          <span className="technical-readout group-hover:text-technical-slate transition-colors">{label}</span>
          <span className="font-display text-sm font-black text-primary">{value}%</span>
        </div>
        <div className="h-3 bg-slate-100 border border-slate-200 overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className={`h-full bg-primary`}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [recentMissions, setRecentMissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await api.get('/workouts?limit=3');
        if (response.data.success) {
          setRecentMissions(response.data.sessions);
        }
      } catch (err) {
        console.error("Failed to fetch recent missions:", err);
      }
    };
    fetchRecent();
  }, []);

  const stats = [
    { label: "Strength", value: profile?.attributes?.strength || 0, icon: Shield, color: "text-primary" },
    { label: "Agility", value: profile?.attributes?.agility || 0, icon: Wind, color: "text-secondary" },
    { label: "Endurance", value: profile?.attributes?.endurance || 0, icon: Flame, color: "text-secondary" },
    { label: "Accuracy", value: profile?.attributes?.accuracy || 0, icon: Target, color: "text-primary" },
  ];

  // Calculate sync status
  const isSyncOk = profile?.updatedAt && (new Date().getTime() - new Date(profile.updatedAt).getTime() < 300000);

  return (
    <AppLayout>
      <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto bg-background/50 min-h-screen">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-2.5 h-2.5 ${isSyncOk ? "bg-secondary animate-pulse" : "bg-muted"}`} />
              <span className="technical-readout text-secondary">Systems_Online // Core_Protocol_V4.0</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl tracking-tighter font-black uppercase text-technical-slate">
              Nexus_<span className="text-primary">Dashboard</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-white px-4 py-2 border-2 border-technical-slate/10">
            <span className={`flex items-center gap-2 technical-readout`}>
              <div className={`w-1.5 h-1.5 ${isSyncOk ? "bg-primary" : "bg-destructive animate-pulse"}`} /> 
              SYNC: {isSyncOk ? "OK" : "STANDBY"}
            </span>
            <span className="flex items-center gap-2 technical-readout"><div className="w-1.5 h-1.5 bg-secondary" /> AI_DNA: STABLE</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Player Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 flat-card bg-white border-technical-slate"
          >
            <div className="flex items-start justify-between mb-10">
              <div>
                <h2 className="font-display text-2xl tracking-tight mb-1 uppercase font-black text-technical-slate">
                  {user?.codename || "AGENT_NEXUS"}
                </h2>
                <div className="technical-readout">
                  Rank: {profile?.experience || "RECRUIT"} | Level {profile?.level || 1}
                </div>
              </div>
              <div className="bg-primary text-white px-6 py-3 bold-border text-center min-w-[120px]">
                <div className="text-[10px] font-display tracking-widest opacity-80 mb-1 uppercase">XP_TOKEN</div>
                <div className="text-2xl font-display font-black">{profile?.xp || 0}</div>
              </div>
            </div>

            {/* XP Bar Evolution */}
            <div className="mb-10 relative">
              <div className="flex justify-between technical-readout mb-2">
                <span>LVL {profile?.level || 1}</span>
                <span className="text-primary">{Math.floor(((profile?.xp || 0) / (profile?.xpToNextLevel || 1000)) * 100)}% PROGRESS</span>
                <span>LVL {(profile?.level || 1) + 1}</span>
              </div>
              <div className="h-6 bg-slate-100 p-1 border-2 border-technical-slate/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((profile?.xp || 0) / (profile?.xpToNextLevel || 1000)) * 100}%` }}
                  transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-primary relative"
                >
                  <div className="absolute inset-0 bg-white/20 scanning-line" />
                </motion.div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8 mt-12">
              {stats.map((s, i) => (
                <StatBar key={s.label} {...s} />
              ))}
            </div>
          </motion.div>

          {/* Avatar / HUD Diagnostics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flat-card bg-white border-primary flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 data-grid-overlay opacity-[0.2]" />

            <div className="relative z-10">
              <div className="w-40 h-40 border-4 border-primary flex items-center justify-center mb-8 relative bg-slate-50">
                <Zap className="w-20 h-20 text-primary animate-float" />
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-primary" />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-primary" />
              </div>
            </div>
            
            <h3 className="technical-readout mb-2 text-technical-slate text-sm">Biometric_Avatar</h3>
            <p className="text-[10px] text-muted-foreground font-body max-w-[200px] uppercase font-bold">
              {isSyncOk ? "Neural link established." : "Link latency detected."}<br/>
              Operator: {user?.codename || "UNKNOWN"}
            </p>
            <Button variant="outline" size="sm" className="mt-8 font-display tracking-widest text-[10px] border-2 border-technical-slate hover:bg-technical-slate hover:text-white transition-all">
              REBOOT_LINK_V4
            </Button>
          </motion.div>
        </div>

        {/* Tactical Modules Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Flame, label: "Streak_Count", value: `${profile?.streak || 0}_Days`, accent: true },
            { icon: TrendingUp, label: "Mission_Sync", value: isSyncOk ? "SYNC_OK" : "PENDING" },
            { icon: Calendar, label: "Total_Missions", value: `${profile?.totalMissions || 0}_Units` },
            { icon: Clock, label: "Power_Output", value: `${profile?.attributes?.power || 0}%` },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flat-card bg-white border-technical-slate/10 hover:border-primary transition-all group"
            >
              <div className={`w-10 h-10 flex items-center justify-center mb-4 transition-colors ${item.accent ? "bg-secondary text-white" : "bg-slate-100 text-technical-slate group-hover:bg-primary group-hover:text-white"}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-display font-black tracking-tight mb-1 uppercase text-technical-slate">{item.value}</div>
              <div className="technical-readout group-hover:text-primary transition-colors">{item.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Mission Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flat-card bg-white border-technical-slate"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="technical-readout text-sm text-technical-slate">Tactical_Mission_Logs</h3>
            <div className="intensity-indicator">ACCESS_GRANTED</div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {recentMissions.map((w, i) => (
              <div key={w._id} className="flex flex-col p-6 border-2 border-technical-slate/5 hover:border-primary transition-all group bg-slate-50/50">
                <div className="technical-readout text-muted-foreground mb-2">OP_ID: {w._id.slice(-4)}</div>
                <div className="text-base font-display font-black tracking-tight mb-4 group-hover:text-primary transition-colors uppercase">{w.name}</div>
                <div className="flex justify-between items-end mt-auto">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">
                    {new Date(w.sessionDate).toLocaleDateString()} // {w.durationMins} MINS
                  </div>
                  <div className="font-display font-black text-secondary uppercase text-sm">{w.caloriesBurned} KCAL</div>
                </div>
              </div>
            ))}
            {recentMissions.length === 0 && (
              <div className="col-span-3 py-16 text-center bg-slate-50 border-2 border-dashed border-technical-slate/10">
                <div className="technical-readout text-muted-foreground">Ready Operator. No mission data currently archived.</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
