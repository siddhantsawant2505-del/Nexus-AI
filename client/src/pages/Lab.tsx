import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Zap, Target, Dumbbell, Apple, Ruler, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

interface StepProps {
  onNext: () => void;
  onPrev: () => void;
}

const goals = ["Build Muscle", "Lose Fat", "Increase Endurance", "Get Stronger", "Improve Flexibility", "Athletic Performance"];
const equipment = ["Full Gym", "Dumbbells Only", "Bodyweight", "Resistance Bands", "Kettlebells", "Home Gym"];
const allergies = ["None", "Gluten", "Dairy", "Nuts", "Shellfish", "Soy", "Eggs"];
const experience = ["Beginner", "Intermediate", "Advanced", "Elite"];

function StepBiometrics({ onNext, data, updateData }: StepProps & { data: any, updateData: (d: any) => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Ruler className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg tracking-[0.2em] uppercase">Biometric_Telemetry</h3>
          <p className="text-[10px] text-muted-foreground font-display tracking-widest">INPUT_PHYSICAL_PARAMETERS</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[
          { key: "height", label: "Height", unit: "CM", type: "number" },
          { key: "weight", label: "Weight", unit: "KG", type: "number" },
          { key: "age", label: "Age", unit: "YR", type: "number" },
          { key: "bodyFat", label: "Body_Fat", unit: "%", type: "number" },
        ].map(i => (
          <div key={i.key} className="group">
            <label className="text-[10px] font-display tracking-widest text-muted-foreground mb-2 block group-hover:text-primary transition-colors">{i.label} // {i.unit}</label>
            <Input 
              type={i.type}
              value={data[i.key] || ''}
              onChange={e => updateData({ [i.key]: Number(e.target.value) })}
              placeholder={`Enter ${i.label}`}
              className="bg-primary/5 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary/30 font-display tracking-wider text-sm h-12" 
            />
          </div>
        ))}
      </div>
      <Button 
        onClick={onNext} 
        disabled={!data.height || !data.weight || !data.age}
        className="w-full font-display tracking-[0.2em] text-xs bg-primary text-primary-foreground py-8 group relative overflow-hidden neon-glow-blue disabled:opacity-50"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          CONTINUE_CALIBRATION <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </Button>
    </div>
  );
}

function StepSelection({ onNext, onPrev, title, icon: Icon, items, subtitle, selected, updateData }: StepProps & { title: string; icon: any; items: string[]; subtitle: string; selected: string[], updateData: (sel: string[]) => void }) {
  const toggle = (item: string) => {
    if (selected.includes(item)) {
      updateData(selected.filter(i => i !== item));
    } else {
      updateData([...selected, item]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg tracking-[0.2em] uppercase">{title.replace(" ", "_")}</h3>
          <p className="text-[10px] text-muted-foreground font-display tracking-widest">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map(item => (
          <button
            key={item}
            onClick={() => toggle(item)}
            className={`p-4 rounded-xl text-[10px] font-display tracking-[0.1em] transition-all text-left relative overflow-hidden group ${
              selected.includes(item)
                ? "bg-primary/20 text-primary border border-primary/50 neon-glow-blue"
                : "bg-card/30 border border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            <div className="relative z-10 flex items-center justify-between">
              {item.toUpperCase().replace(" ", "_")}
              {selected.includes(item) && <Zap className="w-3 h-3 text-primary animate-pulse" />}
            </div>
            {selected.includes(item) && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={onPrev} className="flex-1 font-display tracking-[0.2em] text-[10px] border-primary/20 py-8 hover:bg-primary/5 uppercase">
          <ChevronLeft className="w-3 h-3 mr-2" /> Previous_Step
        </Button>
        <Button disabled={selected.length === 0} onClick={onNext} className="flex-1 font-display tracking-[0.2em] text-[10px] bg-primary text-primary-foreground py-8 group relative overflow-hidden neon-glow-blue uppercase disabled:opacity-50">
          <span className="relative z-10 flex items-center justify-center gap-2">
            Next_Logic <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
          </span>
        </Button>
      </div>
    </div>
  );
}

function StepExperience({ onNext, onPrev, selected, updateData, isSubmitting }: StepProps & { selected: string, updateData: (val: string) => void, isSubmitting: boolean }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
          <Activity className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-display text-lg tracking-[0.2em] uppercase">Evolution_Protocol</h3>
          <p className="text-[10px] text-muted-foreground font-display tracking-widest uppercase">Define_Adaptive_Difficulty</p>
        </div>
      </div>
      <div className="space-y-4">
        {experience.map(level => (
          <button
            key={level}
            onClick={() => updateData(level)}
            className={`w-full p-5 rounded-xl text-left font-display tracking-[0.1em] text-xs transition-all relative overflow-hidden group border ${
              selected === level
                ? "bg-accent/20 text-accent border-accent/50 neon-glow-green"
                : "bg-card/30 border-border/50 text-muted-foreground hover:border-accent/30"
            }`}
          >
            <div className="relative z-10 flex items-center justify-between uppercase">
              {level}_CLASS
              {selected === level && <div className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded">SELECTED</div>}
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={onPrev} disabled={isSubmitting} className="flex-1 font-display tracking-[0.2em] text-[10px] border-accent/20 py-8 hover:bg-accent/5 uppercase">
          <ChevronLeft className="w-3 h-3 mr-2" /> Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!selected || isSubmitting} 
          className="flex-1 font-display tracking-[0.2em] text-[10px] bg-accent text-accent-foreground py-8 group relative overflow-hidden neon-glow-green uppercase disabled:opacity-50"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isSubmitting ? "CALIBRATING..." : "COMPLETE_CALIBRATION"} 
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 ml-1" />}
          </span>
        </Button>
      </div>
    </div>
  );
}

export default function Lab() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    height: 0,
    weight: 0,
    age: 0,
    bodyFat: 0,
    goals: [] as string[],
    equipment: [] as string[],
    allergies: [] as string[],
    experience: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        height: profile.height || prev.height,
        weight: profile.weight || prev.weight,
        age: profile.age || prev.age,
        bodyFat: profile.bodyFat || prev.bodyFat,
        goals: profile.goals || prev.goals,
        equipment: profile.equipment || prev.equipment,
        allergies: profile.allergies || prev.allergies,
        experience: profile.experience || prev.experience
      }));
    }
  }, [profile]);

  const totalSteps = 5;

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.put('/profile', {
        ...formData,
        calibrated: true
      });
      if (response.data.success) {
        toast.success("CALIBRATION_COMPLETE", { description: "Bio-link parameters successfully archived." });
        await refreshProfile();
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("CALIBRATION_FAILED", { description: "Failed to upload parameters to the Nexus network." });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => {
    if (step >= totalSteps - 1) {
      handleComplete();
    } else {
      setStep(s => s + 1);
    }
  };
  const prev = () => setStep(s => Math.max(0, s - 1));

  const steps = [
    <StepBiometrics key="bio" data={formData} updateData={(d) => setFormData(p => ({ ...p, ...d }))} onNext={next} onPrev={prev} />,
    <StepSelection key="goals" selected={formData.goals} updateData={(d) => setFormData(p => ({ ...p, goals: d }))} onNext={next} onPrev={prev} title="MISSION GOALS" subtitle="SELECT_PERFORMANCE_OBJECTIVES" icon={Target} items={goals} />,
    <StepSelection key="equip" selected={formData.equipment} updateData={(d) => setFormData(p => ({ ...p, equipment: d }))} onNext={next} onPrev={prev} title="HARDWARE" subtitle="IDENTIFY_AVAILABLE_EQUIPMENT" icon={Dumbbell} items={equipment} />,
    <StepSelection key="allrg" selected={formData.allergies} updateData={(d) => setFormData(p => ({ ...p, allergies: d }))} onNext={next} onPrev={prev} title="FUEL_CONSTRAINTS" subtitle="BIOLOGICAL_ALLERGIES_&_RESTRICTIONS" icon={Apple} items={allergies} />,
    <StepExperience key="exp" selected={formData.experience} updateData={(d) => setFormData(p => ({ ...p, experience: d }))} onNext={next} onPrev={prev} isSubmitting={isSubmitting} />,
  ];

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 parallax-grid opacity-[0.2]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-line opacity-[0.3]" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block p-3 rounded-full bg-primary/5 border border-primary/20 mb-6 relative">
            <Zap className="w-8 h-8 text-primary neon-text-blue" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping" />
          </div>
          <h2 className="font-display text-4xl tracking-[-0.02em] font-black uppercase text-foreground mb-3">The_<span className="text-primary neon-text-blue">Lab</span></h2>
          <p className="text-[10px] font-display tracking-[0.4em] text-muted-foreground uppercase">Calibration_Sequence // Fitness_DNA_Analysis</p>
        </div>

        {/* Progress System */}
        <div className="flex gap-3 mb-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 space-y-2">
              <div className={`h-1.5 rounded-full transition-all duration-700 relative overflow-hidden ${
                i <= step ? "bg-primary/20 shadow-[0_0_10px_hsl(var(--primary)/0.2)]" : "bg-white/5"
              }`}>
                {i <= step && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    className="h-full bg-primary relative"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]" />
                  </motion.div>
                )}
              </div>
              <div className="text-[8px] font-display text-center tracking-widest text-muted-foreground uppercase opacity-50">
                L_0{i+1}
              </div>
            </div>
          ))}
        </div>

        <div className="holographic-card rounded-2xl p-10 hud-border relative">
          {/* Subtle DNA background icon for the Lab */}
          <Activity className="absolute bottom-4 right-4 w-24 h-24 text-primary/5 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {steps[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-between items-center text-[8px] font-display tracking-[0.5em] text-muted-foreground bg-card/40 backdrop-blur-sm px-6 py-3 rounded-full border border-border/50 max-w-[300px] mx-auto">
          <span>STEP_0{step + 1}</span>
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
          <span>PARITY_SYNC:88%</span>
        </div>
      </div>
    </div>
  );
}
