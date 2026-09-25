import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Trophy, Award, Star, Zap, Shield, Target, Lock, Crown, Gem, Medal, Loader2, Info, Unlock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

const iconMap: Record<string, any> = { Trophy, Award, Star, Zap, Shield, Target, Crown, Gem, Medal };

const rarityColors: Record<string, string> = {
  LEGENDARY: "text-secondary",
  EPIC: "text-primary",
  RARE: "text-blue-400",
  UNCOMMON: "text-primary/60",
  COMMON: "text-muted-foreground",
  MYTHIC: "text-purple-500",
};

const VAULT_LOOT_POOL = [
  { name: "IRON_SIGMA_BADGE",      rarity: "COMMON",    icon: "Shield",  synergy: "Base_Operator_Clearance" },
  { name: "NEXUS_CORE_CHIP",       rarity: "UNCOMMON",  icon: "Zap",     synergy: "Neural_Link_+5%" },
  { name: "PHANTOM_MISSION_DISK",  rarity: "RARE",      icon: "Target",  synergy: "Stealth_Recon_Boost" },
  { name: "TITAN_HYPERTROPHY_KEY", rarity: "EPIC",      icon: "Trophy",  synergy: "Strength_Matrix_+15%" },
  { name: "GHOST_PROTOCOL_CIPHER", rarity: "LEGENDARY", icon: "Crown",   synergy: "Full_Spectrum_Augment" },
  { name: "OMNI_SYNC_CRYSTAL",     rarity: "MYTHIC",    icon: "Gem",     synergy: "Quantum_Bio-Link_Sync" },
  { name: "DELTA_OPERATOR_STAR",   rarity: "RARE",      icon: "Star",    synergy: "Agility_Matrix_+10%" },
  { name: "RECON_MEDAL_ALPHA",     rarity: "UNCOMMON",  icon: "Medal",   synergy: "Mission_XP_+8%" },
  { name: "VORTEX_POWER_CORE",     rarity: "EPIC",      icon: "Zap",     synergy: "Power_Amplifier_+12%" },
  { name: "CENTURION_SIGIL",       rarity: "LEGENDARY", icon: "Award",   synergy: "Arena_Sync_+20%" },
];

// Weighted random roll — higher rarity is less likely
const RARITY_WEIGHTS: Record<string, number> = {
  COMMON: 40, UNCOMMON: 28, RARE: 18, EPIC: 9, LEGENDARY: 4, MYTHIC: 1
};

const rollLoot = () => {
  const roll = Math.random() * 100;
  let cumulative = 0;
  let selectedRarity = "COMMON";
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll <= cumulative) { selectedRarity = rarity; break; }
  }
  const pool = VAULT_LOOT_POOL.filter(l => l.rarity === selectedRarity);
  return pool[Math.floor(Math.random() * pool.length)] || VAULT_LOOT_POOL[0];
};

interface Collectible {
  _id: string;
  name: string;
  rarity: string;
  icon: string;
  synergy: string;
}

interface VaultSummary {
  totalCollectibles: number;
  mythicYield: number;
  legendaryYield: number;
  recentAcquisitions: { name: string; time: string }[];
}

export default function Vault() {
  const [items, setItems] = useState<Collectible[]>([]);
  const [summary, setSummary] = useState<VaultSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [cracking, setCracking] = useState(false);
  const [newItem, setNewItem] = useState<typeof VAULT_LOOT_POOL[0] | null>(null);

  const fetchVaultData = async () => {
    try {
      const [itemsRes, summaryRes] = await Promise.all([
        api.get('/vault/collectibles'),
        api.get('/vault/summary'),
      ]);
      if (itemsRes.data.success) setItems(itemsRes.data.collectibles);
      if (summaryRes.data.success) setSummary(summaryRes.data.summary);
    } catch (err) {
      console.error("Vault sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVaultData(); }, []);

  const handleDecryptVault = async () => {
    if (cracking) return;
    setCracking(true);
    setNewItem(null);

    // Simulate decryption delay
    await new Promise(r => setTimeout(r, 1800));

    const loot = rollLoot();

    try {
      const response = await api.post('/vault/collectibles', loot);
      if (response.data.success) {
        setNewItem(loot);
        await fetchVaultData();
        toast.success(`${loot.rarity}_COLLECTIBLE_ACQUIRED`, {
          description: `${loot.name.replace(/_/g, ' ')} has been archived to your vault.`,
        });
      }
    } catch (err) {
      // If API fails (e.g., offline mode), still show the item locally
      setNewItem(loot);
      const fakeItem = { _id: `local_${Date.now()}`, ...loot };
      setItems(prev => [fakeItem, ...prev]);
      toast.success(`${loot.rarity}_COLLECTIBLE_ACQUIRED`, {
        description: `${loot.name.replace(/_/g, ' ')} archived (offline mode).`,
      });
    } finally {
      setCracking(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Gem className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-display tracking-[0.3em] text-primary uppercase">Asset_Inventory // Personal_Vault</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl tracking-[-0.02em] font-black uppercase">
            Personal_<span className="text-primary neon-text-blue">Vault</span>
          </h1>
        </motion.div>

        {/* New item unlock animation */}
        <AnimatePresence>
          {newItem && (
            <motion.div
              key="new-item-reveal"
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="holographic-card rounded-2xl p-8 hud-border text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-pulse" />
              <div className="relative z-10">
                <div className={`text-[10px] font-display tracking-[0.6em] mb-3 uppercase ${rarityColors[newItem.rarity]}`}>
                  ✦ {newItem.rarity}_PROTOCOL_DECRYPTED ✦
                </div>
                <div className="text-2xl font-display font-black tracking-widest text-foreground uppercase mb-2">
                  {newItem.name.replace(/_/g, ' ')}
                </div>
                <div className="text-[10px] font-display text-muted-foreground uppercase tracking-widest">
                  {newItem.synergy}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-display tracking-[0.4em] text-muted-foreground uppercase animate-pulse">Decrypting_Vault_Archives...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Collection Grid */}
            <div className="lg:col-span-3">
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {items.map((c, i) => {
                    const Icon = iconMap[c.icon] || Award;
                    const color = rarityColors[c.rarity] || rarityColors.COMMON;
                    return (
                      <motion.div
                        key={c._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="holographic-card rounded-2xl p-8 hud-border group cursor-pointer relative overflow-hidden transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-[0.05] pointer-events-none ${color.replace("text", "bg")}`} />
                        <div className="relative z-10 text-center">
                          <div className={`w-24 h-24 rounded-full bg-card/50 border border-border/50 flex items-center justify-center mx-auto mb-6 relative group-hover:border-primary/30 transition-colors ${color}`}>
                            <Icon className="w-10 h-10 group-hover:scale-110 transition-transform" />
                            {["LEGENDARY", "MYTHIC"].includes(c.rarity) && (
                              <div className="absolute inset-0 border border-dashed border-current/20 rounded-full animate-[spin_10s_linear_infinite]" />
                            )}
                          </div>
                          <div className={`text-[8px] font-display tracking-[0.4em] mb-2 uppercase ${color}`}>{c.rarity}</div>
                          <h3 className="font-display text-xs tracking-[0.2em] uppercase text-foreground mb-4">{c.name.replace(/_/g, ' ')}</h3>
                          <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden mb-6 border border-white/5">
                            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className={`h-full ${color.replace("text", "bg")}`} />
                          </div>
                          <div className="text-[10px] font-display text-muted-foreground tracking-widest uppercase">{c.synergy || "Synergy_Unlocked"}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Locked slots */}
                {items.length < 6 && Array.from({ length: Math.max(0, 3 - items.length) }).map((_, i) => (
                  <div key={`locked_${i}`} className="holographic-card rounded-2xl p-8 hud-border opacity-40 grayscale flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="text-[8px] font-display tracking-[0.4em] mb-2 uppercase text-muted-foreground">UNKNOWN_RARITY</div>
                    <h3 className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground">LOCKED_PROTOCOL</h3>
                    <p className="mt-4 text-[8px] font-display tracking-widest text-muted-foreground">DECRYPT_TO_UNLOCK</p>
                  </div>
                ))}
              </div>

              {/* Decrypt CTA */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
                <Button
                  onClick={handleDecryptVault}
                  disabled={cracking}
                  className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 py-10 font-display tracking-[0.3em] text-sm group relative overflow-hidden neon-glow-blue"
                >
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    {cracking ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        DECRYPTING_VAULT_PACKET...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        DECRYPT_VAULT_PROTOCOL
                        <Unlock className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Button>
                <p className="text-center text-[8px] font-display tracking-widest text-muted-foreground mt-3 uppercase">
                  Random_Rarity_Roll // Weighted_Drop_System
                </p>
              </motion.div>
            </div>

            {/* Side Module: Vault Stats */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="holographic-card rounded-2xl p-8 hud-border"
              >
                <h3 className="font-display text-[10px] tracking-[0.3em] uppercase mb-8 text-primary">Archive_Summary</h3>
                <div className="space-y-6">
                  {[
                    { label: "Total_Collectibles", val: `${summary?.totalCollectibles || 0} / 50` },
                    { label: "Mythic_Yield",       val: `${(summary?.mythicYield || 0).toString().padStart(2, '0')} / 05` },
                    { label: "Legendary_Yield",    val: `${(summary?.legendaryYield || 0).toString().padStart(2, '0')}` },
                    { label: "Vault_Clearance",    val: "LVL_SECURE" },
                  ].map(s => (
                    <div key={s.label} className="border-b border-white/5 pb-4 group cursor-pointer">
                      <div className="text-[7px] font-display tracking-widest text-muted-foreground uppercase group-hover:text-primary transition-colors mb-1">{s.label}</div>
                      <div className="text-xl font-display tracking-wider text-foreground uppercase">{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Rarity distribution bars */}
                <div className="mt-8 space-y-3">
                  <div className="text-[7px] font-display tracking-widest text-muted-foreground uppercase mb-4">Drop_Rate_Matrix</div>
                  {Object.entries(RARITY_WEIGHTS).map(([rarity, weight]) => (
                    <div key={rarity}>
                      <div className="flex justify-between text-[7px] font-display tracking-widest mb-1">
                        <span className={rarityColors[rarity] || 'text-muted-foreground'}>{rarity}</span>
                        <span className="text-muted-foreground">{weight}%</span>
                      </div>
                      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${(rarityColors[rarity] || 'text-muted-foreground').replace('text', 'bg')}`}
                          style={{ width: `${weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={fetchVaultData}
                  variant="ghost"
                  className="w-full mt-6 text-muted-foreground hover:text-primary font-display tracking-[0.2em] text-[10px] uppercase"
                >
                  <RefreshCw className="w-3 h-3 mr-2" /> Refresh_Archive
                </Button>
              </motion.div>

              {/* Recent Acquisitions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="holographic-card rounded-2xl p-8 hud-border"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Medal className="w-4 h-4 text-accent" />
                  <h3 className="font-display text-[10px] tracking-[0.3em] uppercase">Session_Loot</h3>
                </div>
                <div className="space-y-4">
                  {summary?.recentAcquisitions.map(l => (
                    <div key={l.name} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 group hover:border-primary/30 transition-colors">
                      <span className="text-[10px] font-display text-foreground group-hover:text-primary uppercase">{l.name.replace(/_/g, ' ')}</span>
                      <span className="text-[8px] font-display text-muted-foreground uppercase">{new Date(l.time).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {(!summary?.recentAcquisitions || summary.recentAcquisitions.length === 0) && (
                    <div className="text-center py-4">
                      <Info className="w-4 h-4 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-[8px] font-display tracking-widest text-muted-foreground uppercase">No_Recent_Archives // Decrypt_First_Package</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
