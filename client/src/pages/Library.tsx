import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  BookOpen, Clock, Zap, Dumbbell, Filter, Loader2, 
  Plus, Target, ChevronRight, ChevronLeft, Save, TrendingUp, RefreshCw 
} from "lucide-react";

const difficultyColor: Record<string, string> = {
  Easy: "text-accent border-accent/30 bg-accent/10",
  Medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Hard: "text-primary border-primary/30 bg-primary/10",
  Extreme: "text-destructive border-destructive/30 bg-destructive/10",
};

export default function Library() {
  const { profile } = useAuth();
  const [view, setView] = useState<'grid' | 'ai_wizard' | 'recommendation' | 'manual_build'>('grid');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardStep, setWizardStep] = useState(0);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [missionName, setMissionName] = useState("");
  const [refineScale, setRefineScale] = useState(0.3);

  // Manual Build States
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [manualProtocol, setManualProtocol] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [wizardData, setWizardData] = useState({
    muscles: [] as string[],
    goal: "Build Muscle",
    equipment: profile?.equipment || ["Bodyweight"]
  });

  const muscleOptions = ["Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Abs", "Arms", "Glutes", "Calves"];
  const goals = ["Build Muscle", "Lose Fat", "Athletic Performance", "Strength", "Full Body"];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/templates');
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ml/workouts/recommend', {
        goal: wizardData.goal,
        hardware: wizardData.equipment,
        experience: profile?.experience || "Beginner",
        target_muscles: wizardData.muscles
      });
      if (res.data.success) {
        setRecommendation(res.data.protocol);
        setMissionName(res.data.mission_name || "ALPHA_MISSION");
        setView('recommendation');
      }
    } catch (err) {
      toast.error("SYNTHESIS_FAILED", { description: "The AI engine is unresponsive. Try later." });
    } finally {
      setLoading(false);
    }
  };

  const fetchExercisesForManual = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ml/workouts/exercises');
      if (res.data.success) {
        setAllExercises(res.data.exercises);
        setView('manual_build');
      }
    } catch (err) {
      toast.error("DATA_FETCH_FAILED");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async (scale: number) => {
    setRefineScale(scale);
    setLoading(true);
    try {
      const res = await api.post('/ml/workouts/refine', {
        protocol: recommendation,
        refine_scale: scale
      });
      if (res.data.success) {
        setRecommendation(res.data.protocol);
        toast.info("NEURAL_RECALIBRATION", { description: scale > 0.5 ? "Higher intensity variations applied." : "Volume parameters increased." });
      }
    } catch (err) {
      toast.error("REFINE_FAILED");
    } finally {
      setLoading(false);
    }
  };

  const saveProtocol = async () => {
    try {
      const res = await api.post('/templates', {
        name: `AI_${wizardData.goal.replace(" ", "_")}_${new Date().getTime().toString().slice(-4)}`,
        duration: "45 min",
        difficulty: recommendation[0]?.difficulty || "Medium",
        muscles: wizardData.muscles,
        equipment: wizardData.equipment,
        isAI: true,
        exercises: recommendation
      });
      if (res.data.success) {
        toast.success("PROTOCOL_ARCHIVED", { description: "Mission added to your personal vault." });
        setView('grid');
        fetchTemplates();
      }
    } catch (err) {
      toast.error("SAVE_FAILED");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header Overlay */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/30">
          <div>
            <h1 className="font-display text-4xl tracking-tighter mb-1 uppercase font-black">
              Protocols / <span className="text-primary neon-text-blue">Library</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              AI_Sourced_Performance_Modules
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => { setView('ai_wizard'); setWizardStep(0); }} 
              className="bg-primary text-primary-foreground font-display tracking-[0.2em] text-[10px] px-6 py-6 group relative overflow-hidden neon-glow-blue"
            >
              <Zap className="w-3.5 h-3.5 mr-2 group-hover:scale-125 transition-transform" /> 
              GENERATE_AI_PROTOCOL
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchExercisesForManual}
              className="font-display tracking-[0.2em] text-[10px] border-border/50 py-6 px-6 hover:bg-primary/5 uppercase"
            >
              <Plus className="w-3.5 h-3.5 mr-2" /> Manual_Build
            </Button>
          </div>
        </motion.div>

        {loading && view !== 'recommendation' ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 bg-card/10 rounded-3xl border border-dashed border-border/30">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-display tracking-[0.5em] text-muted-foreground uppercase animate-pulse">Syncing_Protocol_Archives...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'grid' && (
              <motion.div 
                key="grid"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {templates.map((w, i) => (
                  <motion.div
                    key={w._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="holographic-card rounded-2xl p-6 hud-border group cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span className={`text-[8px] font-display tracking-[.3em] px-3 py-1 rounded-full border uppercase ${difficultyColor[w.difficulty] || difficultyColor.Hard}`}>
                        {w.difficulty}
                      </span>
                    </div>
                    <h3 className="font-display text-base tracking-wide mb-3 group-hover:text-primary transition-colors uppercase font-bold">{w.name}</h3>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-display tracking-widest mb-4">
                      <span className="flex items-center gap-1.5 uppercase"><Clock className="w-3.5 h-3.5" />{w.duration}</span>
                      <span className="flex items-center gap-1.5 uppercase shrink-0"><Zap className="w-3.5 h-3.5" />{w.muscles[0]}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {w.equipment.slice(0, 3).map((e: string) => (
                        <span key={e} className="text-[8px] font-display tracking-widest px-2 py-1 rounded-lg bg-secondary/5 border border-secondary/20 text-muted-foreground uppercase">
                          {e}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {view === 'ai_wizard' && (
              <motion.div 
                key="wizard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto py-12"
              >
                <div className="holographic-card rounded-3xl p-10 hud-border">
                  {wizardStep === 0 && (
                    <div className="space-y-8">
                       <div className="flex items-center gap-4 mb-4">
                        <Target className="w-8 h-8 text-primary" />
                        <div>
                          <h2 className="font-display text-2xl tracking-tighter uppercase font-black">Target_Muscles</h2>
                          <p className="text-[10px] text-muted-foreground font-display tracking-widest uppercase">Select_Neural_Focus_Zones</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {muscleOptions.map(m => (
                          <button
                            key={m}
                            onClick={() => {
                              const news = wizardData.muscles.includes(m) 
                                ? wizardData.muscles.filter(x => x !== m)
                                : [...wizardData.muscles, m];
                              setWizardData({...wizardData, muscles: news});
                            }}
                            className={`p-4 rounded-xl font-display text-[10px] tracking-widest border transition-all text-left uppercase ${
                              wizardData.muscles.includes(m) ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-border/50 text-muted-foreground hover:bg-white/10"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <Button 
                        disabled={wizardData.muscles.length === 0}
                        onClick={() => setWizardStep(1)} 
                        className="w-full py-8 font-display tracking-[0.4em] text-[10px] bg-primary text-primary-foreground uppercase"
                      >
                       Continue_Setup <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {wizardStep === 1 && (
                     <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-4">
                          <TrendingUp className="w-8 h-8 text-accent" />
                          <div>
                            <h2 className="font-display text-2xl tracking-tighter uppercase font-black">Mission_Goal</h2>
                            <p className="text-[10px] text-muted-foreground font-display tracking-widest uppercase">Define_Operational_Objective</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {goals.map(g => (
                            <button
                              key={g}
                              onClick={() => setWizardData({...wizardData, goal: g})}
                              className={`w-full p-5 rounded-xl font-display text-xs tracking-widest border transition-all text-left uppercase ${
                                wizardData.goal === g ? "bg-accent/20 border-accent text-accent" : "bg-white/5 border-border/50 text-muted-foreground hover:bg-white/10"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-4">
                          <Button variant="outline" onClick={() => setWizardStep(0)} className="flex-1 py-8 font-display tracking-[0.2em] text-[10px] border-border/50 uppercase">
                            <ChevronLeft className="mr-2 w-4 h-4" /> Back
                          </Button>
                          <Button onClick={handleGenerateAI} className="flex-1 py-8 font-display tracking-[0.2em] text-[10px] bg-primary text-primary-foreground uppercase">
                           Synthesize_Protocol <Zap className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                     </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'recommendation' && (
              <motion.div 
                key="recommendation"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-3xl tracking-tighter uppercase font-black">{missionName}</h2>
                    <p className="text-[10px] text-muted-foreground font-display tracking-widest uppercase">Protocol_Optimized_By_Nexus_AI</p>
                  </div>
                  <div className="flex gap-4">
                     <Button variant="outline" onClick={() => setView('ai_wizard')} className="font-display tracking-[0.2em] border-border/50 py-6 px-8 uppercase text-[10px]">
                      <RefreshCw className="mr-2 w-4 h-4" /> Re_Calibrate
                     </Button>
                     <Button onClick={saveProtocol} className="bg-primary text-primary-foreground font-display tracking-[0.2em] py-6 px-8 uppercase text-[10px]">
                      <Save className="mr-2 w-4 h-4" /> Archive_Protocol
                     </Button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    {recommendation?.map((ex: any, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={ex.id} 
                        className="holographic-card rounded-2xl p-6 hud-border flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display text-primary text-xl font-black">
                            {i + 1}
                           </div>
                           <div>
                              <h4 className="font-display text-sm tracking-widest uppercase font-bold text-foreground group-hover:text-primary transition-colors">{ex.name}</h4>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] text-muted-foreground font-display tracking-widest uppercase">{ex.difficulty} // {ex.id.split("_")[0]}</p>
                                {ex.match_score && (
                                  <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-black">
                                    SYN_CONF: {ex.match_score}%
                                  </span>
                                )}
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-8 items-center">
                           <div className="text-right">
                              <div className="text-xl font-display text-foreground">{ex.sets}</div>
                              <div className="text-[8px] font-display text-muted-foreground tracking-widest uppercase">Sets</div>
                           </div>
                           <div className="text-right">
                              <div className="text-xl font-display text-primary">{ex.reps}</div>
                              <div className="text-[8px] font-display text-muted-foreground tracking-widest uppercase">Reps</div>
                           </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="space-y-6">
                     <div className="holographic-card rounded-2xl p-8 hud-border bg-primary/5">
                        <h3 className="font-display text-[10px] tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
                           <Zap className="w-3.5 h-3.5 text-primary" /> Adaptive_Refinement
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-display tracking-widest leading-relaxed mb-8 uppercase">
                           Shift the scale to balance between volume optimization and neural difficulty variations.
                        </p>
                        
                        <div className="space-y-12 py-4">
                           <div className="relative">
                              <input 
                                type="range" 
                                min="0.1" 
                                max="1.0" 
                                step="0.1" 
                                value={refineScale}
                                onChange={(e) => handleRefine(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary" 
                              />
                              <div className="flex justify-between mt-4 text-[8px] font-display tracking-[0.2em] text-muted-foreground uppercase">
                                 <span>Volume_Scale</span>
                                 <span>Neural_Shift</span>
                              </div>
                           </div>
                        </div>

                        <div className="mt-8 p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
                            <div className="flex justify-between text-[8px] font-display tracking-widest uppercase">
                               <span className="text-muted-foreground">Calibration_Mode:</span>
                               <span className="text-primary">{refineScale > 0.5 ? "HEX_VARIANT" : "LINEAR_REPS"}</span>
                            </div>
                            <div className="flex justify-between text-[8px] font-display tracking-widest uppercase">
                               <span className="text-muted-foreground">Neural_Load:</span>
                               <span className="text-primary">{Math.round(refineScale * 100)}%</span>
                            </div>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
            {view === 'manual_build' && (
               <motion.div 
                key="manual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid lg:grid-cols-4 gap-8"
              >
                <div className="lg:col-span-1 space-y-6">
                  <div className="holographic-card rounded-2xl p-6 hud-border">
                    <h3 className="font-display text-[10px] tracking-widest uppercase mb-4 text-primary font-bold">Protocol_Details</h3>
                    <input 
                      placeholder="Mission_Name..." 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[10px] uppercase font-display tracking-widest text-foreground outline-none mb-4"
                      value={missionName}
                      onChange={(e) => setMissionName(e.target.value)}
                    />
                    <Button 
                      disabled={manualProtocol.length === 0 || !missionName}
                      onClick={() => { setRecommendation(manualProtocol); setView('recommendation'); }}
                      className="w-full py-6 font-display tracking-widest text-[10px] bg-primary text-primary-foreground uppercase"
                    >
                      Process_Build <ChevronRight className="ml-2 w-3 h-3" />
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => { setView('grid'); setManualProtocol([]); setMissionName(""); }}
                      className="w-full py-6 mt-2 font-display tracking-widest text-[10px] border-border/50 uppercase"
                    >
                      Discard_Draft
                    </Button>
                  </div>

                  <div className="holographic-card rounded-2xl p-6 hud-border">
                    <h3 className="font-display text-[10px] tracking-widest uppercase mb-4 text-muted-foreground font-bold">Planned_Sequence</h3>
                    <div className="space-y-2">
                       {manualProtocol.length === 0 && <p className="text-[8px] text-muted-foreground uppercase text-center py-4">No exercises added.</p>}
                       {manualProtocol.map((p, i) => (
                         <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 text-[8px] font-display text-foreground uppercase tracking-tighter">
                            <span>{p.name.slice(0, 20)}</span>
                            <button onClick={() => setManualProtocol(manualProtocol.filter((_, idx) => idx !== i))} className="text-destructive hover:scale-110">X</button>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  <div className="flex items-center gap-4 bg-card/10 p-4 rounded-xl border border-border/30">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <input 
                      placeholder="Search_Neural_Database..." 
                      className="bg-transparent border-none outline-none text-xs font-display tracking-widest uppercase w-full text-foreground"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {allExercises
                      .filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || ex.muscle.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 50)
                      .map((ex) => (
                      <div 
                        key={ex.id} 
                        className="holographic-card rounded-xl p-4 hud-border flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => setManualProtocol([...manualProtocol, { ...ex, sets: 3, reps: 12 }])}
                      >
                         <div>
                            <h4 className="font-display text-[10px] tracking-widest uppercase font-bold text-foreground group-hover:text-primary transition-colors">{ex.name}</h4>
                            <p className="text-[8px] text-muted-foreground font-display tracking-widest uppercase">{ex.muscle} // {ex.equipment}</p>
                         </div>
                         <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-125 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
               </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </AppLayout>
  );
}
