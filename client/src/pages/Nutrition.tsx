import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Apple, Coffee, ChefHat, Activity, Target, Zap, Clock, Shield, Search, Camera, Loader2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Meal {
  _id: string;
  name: string;
  cals: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  type: string;
}

interface NutritionLog {
  meals: Meal[];
  calorieGoal: number;
  hydrationL: number;
  hydrationGoalL: number;
}

export default function Nutrition() {
  const [log, setLog] = useState<NutritionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const scanResponse = await api.post('/ml/workouts/scan-food', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (scanResponse.data.success) {
        const mealData = {
          ...scanResponse.data.meal,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const logResponse = await api.post('/nutrition/meal', mealData);
        if (logResponse.data.success) {
          setLog(logResponse.data.log);
          toast.success("MOLECULAR_SCAN_COMPLETE", {
            description: `Detected: ${mealData.name} (+${mealData.cals} KCAL). Integrated into profile.`
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("SCAN_DECRYPTION_FAILED", {
        description: "Could not parse molecular composition of file."
      });
    } finally {
      setScanning(false);
    }
  };

  const fetchTodayLog = async () => {
    try {
      const response = await api.get('/nutrition/today');
      if (response.data.success) {
        setLog(response.data.log);
      }
    } catch (err) {
      console.error("Failed to fetch nutrition log:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayLog();
  }, []);

  const totalCals = log?.meals.reduce((sum, m) => sum + m.cals, 0) || 0;
  const totalProtein = log?.meals.reduce((sum, m) => sum + (m.protein || 0), 0) || 0;
  const totalCarbs = log?.meals.reduce((sum, m) => sum + (m.carbs || 0), 0) || 0;
  const totalFat = log?.meals.reduce((sum, m) => sum + (m.fat || 0), 0) || 0;

  const nutritionStats = [
    { label: "Protein_Synthesize", val: totalProtein, goal: 200, unit: "G", color: "bg-primary" },
    { label: "Carb_Fuel", val: totalCarbs, goal: 300, unit: "G", color: "bg-accent" },
    { label: "Lipid_Balance", val: totalFat, goal: 80, unit: "G", color: "bg-orange-500" },
  ];

  const handleAddMeal = async () => {
    setSyncing(true);
    
    // Select from a pool of real athletic protocols to vary dummy data until full UI is built
    const protocols = [
      { name: "Proteolytic_Repair_Phase", cals: 520, protein: 55, carbs: 40, fat: 12, type: "POST_WORKOUT" },
      { name: "Glycogen_Resynthesize_V4", cals: 650, protein: 30, carbs: 110, fat: 8, type: "LUNCH" },
      { name: "Metabolic_Ignition_Unit", cals: 380, protein: 25, carbs: 45, fat: 10, type: "BREAKFAST" },
      { name: "Nocturnal_Anabolic_Stack", cals: 320, protein: 40, carbs: 5, fat: 15, type: "SNACK" },
    ];
    
    const selected = protocols[Math.floor(Math.random() * protocols.length)];
    const mealData = {
      ...selected,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const response = await api.post('/nutrition/meal', mealData);
      if (response.data.success) {
        setLog(response.data.log);
        toast.success("FUEL_LOG_ARCHIVED", {
          description: "Nutritional batch successfully integrated into bio-profile."
        });
      }
    } catch (err) {
      toast.error("SYNC_ERROR", {
        description: "Failed to upload nutritional telemetry."
      });
    } finally {
      setSyncing(false);
    }
  };

  const updateHydration = async (change: number) => {
    if (!log) return;
    const newLevel = Math.max(0, Math.min(log.hydrationGoalL, (log.hydrationL || 0) + change));
    
    try {
      const response = await api.patch('/nutrition/hydration', { hydrationL: newLevel });
      if (response.data.success) {
        setLog(response.data.log);
      }
    } catch (err) {
      toast.error("HYDRATION_SYNC_FAILED");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-[10px] font-display tracking-[0.4em] text-muted-foreground uppercase animate-pulse">Scanning_Bio_Input_Vault...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Apple className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-display tracking-[0.3em] text-primary uppercase">Bio_Fuel_Optimizer // Molecular_Input</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl tracking-[-0.02em] font-black uppercase">
            Nutrition_<span className="text-primary neon-text-blue">Vault</span>
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Core: Fuel Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 holographic-card rounded-2xl p-8 hud-border flex flex-col"
          >
            <div className="flex items-start justify-between mb-10">
              <div>
                <h3 className="font-display text-xl tracking-[0.2em] mb-2 uppercase">Fuel_Reserves</h3>
                <p className="text-[10px] text-muted-foreground font-body">Current daily intake cycle: {Math.floor((totalCals / (log?.calorieGoal || 2400)) * 100)}% OPTIMAL</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-display text-foreground tracking-tight">{totalCals} / {log?.calorieGoal || 2400}</div>
                <div className="text-[10px] font-display tracking-widest text-primary/60 uppercase">TOTAL_KCAL_INVENTORY</div>
              </div>
            </div>

            <div className="grid gap-8 flex-1">
              {nutritionStats.map((d, i) => (
                <div key={d.label} className="group cursor-crosshair">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <div className="text-[8px] font-display tracking-[0.3em] text-muted-foreground uppercase mb-1">{d.label}</div>
                      <div className="text-xl font-display text-foreground uppercase">{d.val} {d.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-display text-muted-foreground">GOAL: {d.goal} {d.unit}</div>
                      <div className={`text-[8px] font-display tracking-widest ${d.val >= d.goal ? "text-accent" : "text-primary/60"} uppercase`}>
                        {Math.floor((d.val / d.goal) * 100)}%_RESERVE
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((d.val / d.goal) * 100, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 + i * 0.1 }}
                      className={`h-full ${d.color} relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] animate-[shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-4">
              <Button 
                onClick={handleAddMeal}
                disabled={syncing}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-8 font-display tracking-[0.2em] text-[10px] group relative overflow-hidden neon-glow-blue"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {syncing ? "ARCHIVING..." : "LOG_FUEL_BATCH"} <Zap className="w-3 h-3" />
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Button>
              <Button variant="outline" className="flex-1 border-white/10 text-muted-foreground hover:bg-white/5 py-8 font-display tracking-[0.2em] text-[10px]">
                MANAGE_INVENTORY
              </Button>
            </div>
          </motion.div>

          {/* AI Scanner / Visualizer */}
          <div className="space-y-8">
            <motion.div
              onClick={() => document.getElementById('bio-scanner-input')?.click()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="holographic-card rounded-2xl p-8 hud-border text-center relative overflow-hidden group cursor-pointer"
            >
              <input 
                id="bio-scanner-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScanImage}
                disabled={scanning}
              />
              <div className="absolute inset-0 pointer-events-none opacity-[0.2] overflow-hidden">
                <div className="w-full h-px bg-primary absolute top-0 animate-scan-line" />
                <div className="w-px h-full bg-primary absolute left-0 animate-scan-line-horizontal" />
              </div>

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-colors">
                  {scanning ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-primary animate-pulse" />
                  )}
                </div>
                <h3 className="font-display text-sm tracking-[0.3em] uppercase mb-2">
                  {scanning ? "SCANNING_MOLECULES..." : "Bio_Aperio_Scanner"}
                </h3>
                <p className="text-[10px] text-muted-foreground font-body max-w-[180px] mx-auto leading-relaxed uppercase">
                  {scanning ? "Calibrating macro density metrics..." : "Point optical sensor at nutrition batch for real-time molecular analysis."}
                </p>
                <div className="mt-8 pt-6 border-t border-border/30 flex justify-between px-4">
                  <div className="text-center">
                    <div className="text-xs font-display text-primary">0.4s</div>
                    <div className="text-[8px] font-display text-muted-foreground uppercase">SPEED</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-display text-accent">94%</div>
                    <div className="text-[8px] font-display text-muted-foreground uppercase">ACCURACY</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Hydration Matrix */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="holographic-card rounded-2xl p-8 hud-border"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-[10px] tracking-[0.3em] uppercase">Hydration_Matrix</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => updateHydration(-0.25)} className="w-6 h-6 rounded-full border border-white/10">
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-[10px] font-display text-primary w-20 text-center uppercase">{(log?.hydrationL || 0).toFixed(2)} / {log?.hydrationGoalL || 3.0} L</span>
                  <Button variant="ghost" size="icon" onClick={() => updateHydration(0.25)} className="w-6 h-6 rounded-full border border-white/10">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 10 }).map((_, i) => {
                  const level = ((log?.hydrationL || 0) / (log?.hydrationGoalL || 3.0)) * 10;
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 4 }}
                      animate={{ height: i < level ? 40 : 4 }}
                      className={`flex-1 rounded-full transition-all ${i < level ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "bg-white/5"}`}
                      transition={{ type: "spring", stiffness: 100 }}
                    />
                  );
                })}
              </div>
              <div className="mt-6 flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="text-[8px] font-display tracking-[0.3em] text-primary/60 uppercase">System_Fluidity</div>
                <div className="text-xs font-display text-primary uppercase">
                  {(log?.hydrationL || 0) >= (log?.hydrationGoalL || 3.0) ? "SATUATED" : "OPTIMAL"}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Feeding Ops Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="holographic-card rounded-2xl p-8 hud-border"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ChefHat className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-display text-sm tracking-[0.3em] uppercase">Feeding_Operation_Logs</h3>
            </div>
            <div className="flex gap-4">
              <div className="text-[10px] font-display text-muted-foreground hover:text-primary cursor-pointer transition-colors uppercase">EXCEL_LOGS</div>
              <div className="text-[10px] font-display text-muted-foreground hover:text-primary cursor-pointer transition-colors uppercase">FILTER_SESSIONS</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="pb-4 text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase opacity-50">Log_Timestamp</th>
                  <th className="pb-4 text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase opacity-50">Fuel_Source</th>
                  <th className="pb-4 text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase opacity-50">Molecular_Weight</th>
                  <th className="pb-4 text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase opacity-50">Efficiency</th>
                  <th className="pb-4 text-right text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase opacity-50">Kcal_Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <AnimatePresence>
                  {log?.meals.map((m, i) => (
                    <motion.tr 
                      key={m._id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="py-5 text-[10px] font-display text-muted-foreground group-hover:text-primary transition-colors uppercase">{m.time} // {m.type}</td>
                      <td className="py-5 text-[12px] font-display tracking-widest text-foreground uppercase">{m.name}</td>
                      <td className="py-5">
                        <div className="text-[10px] font-display text-muted-foreground uppercase">{m.protein}P / {m.carbs}C / {m.fat}F</div>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span className="text-[10px] font-display tracking-widest text-accent uppercase">HIGH</span>
                        </div>
                      </td>
                      <td className="py-5 text-right font-display text-primary neon-text-blue">{m.cals} UNITS</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {(!log?.meals || log.meals.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[10px] font-display tracking-[0.4em] text-muted-foreground uppercase">
                      No_Fuel_Data_Detected_For_Current_Cycle
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
