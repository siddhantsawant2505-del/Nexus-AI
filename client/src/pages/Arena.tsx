import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Trophy, Sword, Target, Zap, Shield, Flame, User, Loader2, Wifi, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  codename: string;
  level: number;
  syncPoints: number;
  streak: number;
  totalMissions: number;
  attributes: { strength: number; agility: number; endurance: number };
  isCurrentUser: boolean;
}

interface Opponent {
  codename: string;
  level: number;
  syncPoints: number;
  reps: number;
  calories: number;
}

type MatchState = 'idle' | 'searching' | 'matched' | 'finished';

function RankCard({ player, index }: { player: LeaderboardEntry; index: number }) {
  const isTop1 = player.rank === 1;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`holographic-card rounded-xl p-5 mb-4 group cursor-pointer border relative overflow-hidden transition-all ${
        player.isCurrentUser
          ? "border-primary/40 bg-primary/10 neon-glow-blue"
          : "border-border/50 hover:bg-white/5"
      }`}
    >
      {isTop1 && (
        <div className="absolute inset-0 bg-secondary/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 pointer-events-none opacity-50" />
      )}
      <div className="relative z-10 flex items-center gap-6">
        <div className="w-12 text-center">
          <div className={`font-display text-2xl font-black ${isTop1 ? "text-secondary neon-text-green" : "text-foreground/40"}`}>
            {player.rank < 10 ? `0${player.rank}` : player.rank}
          </div>
        </div>
        <div className="flex-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-card border border-border/50 flex items-center justify-center relative overflow-hidden group-hover:border-primary/40 transition-colors">
            {isTop1 ? <Trophy className="w-6 h-6 text-secondary animate-bounce" /> : <User className="w-6 h-6 text-muted-foreground" />}
            {player.isCurrentUser && <div className="absolute inset-0 bg-primary/10 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-display tracking-[0.2em] text-xs uppercase ${player.isCurrentUser ? "text-primary neon-text-blue" : "text-foreground"}`}>
                {player.codename}
              </span>
              {player.isCurrentUser && <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/20">YOU</span>}
            </div>
            <div className="text-[8px] font-display tracking-widest text-muted-foreground uppercase">LEVEL_{player.level} // SYNC: {player.syncPoints.toLocaleString()}</div>
          </div>
        </div>
        <div className="hidden md:flex gap-4 items-center">
          {[player.attributes.strength, player.attributes.agility, player.attributes.endurance].map((s, i) => (
            <div key={i} className="space-y-1 w-8">
              <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${isTop1 ? "bg-secondary" : "bg-primary"}`} style={{ width: `${s}%` }} />
              </div>
              <div className="text-[6px] font-display text-muted-foreground text-center">{s}%</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Arena() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeStats, setActiveStats] = useState({ operators: 0 });
  const [loading, setLoading] = useState(true);
  const { profile, user } = useAuth();

  // Matchmaking state
  const [matchState, setMatchState] = useState<MatchState>('idle');
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [myReps, setMyReps] = useState(0);
  const [myCalories, setMyCalories] = useState(0);
  const [opponentReps, setOpponentReps] = useState(0);
  const [opponentCalories, setOpponentCalories] = useState(0);
  const [matchSeconds, setMatchSeconds] = useState(0);
  const [matchDuration] = useState(60); // 60-second duel
  const socketRef = useRef<Socket | null>(null);
  const matchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchArenaData = async () => {
      try {
        const [lbRes, lobbyRes] = await Promise.all([
          api.get('/arena/leaderboard'),
          api.get('/arena/active-lobbies'),
        ]);
        if (lbRes.data.success) setLeaderboard(lbRes.data.leaderboard);
        if (lobbyRes.data.success) setActiveStats({ operators: lobbyRes.data.activeOperators });
      } catch (err) {
        console.error("Arena sync failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArenaData();

    return () => {
      socketRef.current?.disconnect();
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
      if (repTimerRef.current) clearInterval(repTimerRef.current);
    };
  }, []);

  const handleJoinMatchmaking = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io('http://localhost:5000', { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[ARENA] Socket connected:', socket.id);
      setMatchState('searching');
      socket.emit('join_matchmaking', {
        codename: user?.codename || 'OPERATOR',
        level: profile?.level || 1,
        syncPoints: profile?.syncPoints || 0,
      });
    });

    socket.on('matchmaking_status', ({ status }) => {
      if (status === 'SEARCHING') {
        toast.info("NEXUS_SCAN_ACTIVE", { description: "Scanning global conflict zones for adversary..." });
      }
    });

    socket.on('match_found', ({ opponent: opp }: { matchId: string; opponent: Opponent }) => {
      setOpponent(opp);
      setOpponentReps(0);
      setOpponentCalories(0);
      setMyReps(0);
      setMyCalories(0);
      setMatchSeconds(0);
      setMatchState('matched');
      toast.success("ADVERSARY_LOCKED", { description: `Matched against ${opp.codename} // LEVEL_${opp.level}` });

      // Start match timer
      matchTimerRef.current = setInterval(() => {
        setMatchSeconds(prev => {
          if (prev >= matchDuration - 1) {
            clearInterval(matchTimerRef.current!);
            clearInterval(repTimerRef.current!);
            setMatchState('finished');
            socket.emit('leave_match');
            return matchDuration;
          }
          return prev + 1;
        });
      }, 1000);

      // Simulate own reps every 4 seconds
      repTimerRef.current = setInterval(() => {
        setMyReps(prev => {
          const next = prev + 1;
          setMyCalories(Math.floor(next * 2.5));
          socket.emit('rep_update', { reps: next, calories: Math.floor(next * 2.5) });
          return next;
        });
      }, 4000);
    });

    socket.on('opponent_update', ({ reps, calories }: { reps: number; calories: number }) => {
      setOpponentReps(reps);
      setOpponentCalories(calories);
    });

    socket.on('connect_error', () => {
      toast.error("CONNECTION_FAILED", { description: "Cannot reach Nexus Arena servers." });
      setMatchState('idle');
    });
  };

  const handleLeaveMatch = () => {
    socketRef.current?.emit('leave_match');
    socketRef.current?.disconnect();
    if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    if (repTimerRef.current) clearInterval(repTimerRef.current);
    setMatchState('idle');
    setOpponent(null);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const myProgress = matchDuration > 0 ? (matchSeconds / matchDuration) * 100 : 0;
  const myScore = myReps * 10 + myCalories;
  const oppScore = opponentReps * 10 + opponentCalories;

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">

        {/* DUEL HUD overlay — shown when in match or finished */}
        <AnimatePresence>
          {(matchState === 'matched' || matchState === 'finished') && opponent && (
            <motion.div
              key="duel-hud"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="holographic-card rounded-3xl hud-border p-8 mb-8 relative overflow-hidden"
            >
              {/* Background animated gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-destructive/5 animate-pulse pointer-events-none" />

              <div className="relative z-10">
                {/* Timer bar */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Sword className="w-5 h-5 text-primary animate-pulse" />
                    <span className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">Global_Conflict_Active</span>
                  </div>
                  <div className="font-display text-2xl text-foreground tracking-widest">
                    {matchState === 'finished' ? 'DUEL_COMPLETE' : formatTime(matchDuration - matchSeconds)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLeaveMatch}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Timer progress bar */}
                <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-8">
                  <motion.div
                    animate={{ width: `${myProgress}%` }}
                    className="h-full bg-gradient-to-r from-primary to-destructive"
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Duel scoreboard */}
                <div className="grid grid-cols-3 gap-6 items-center">
                  {/* YOU */}
                  <div className="text-center space-y-4">
                    <div className="text-[10px] font-display tracking-[0.3em] text-primary uppercase">YOU</div>
                    <div className="text-5xl font-display font-black text-primary neon-text-blue">{myReps}</div>
                    <div className="text-[8px] font-display text-muted-foreground uppercase">REPS</div>
                    <div className="text-sm font-display text-foreground">{myCalories} KCAL</div>
                    <div className={`text-xs font-display px-3 py-1 rounded-full border ${myScore > oppScore ? 'text-accent border-accent/30 bg-accent/10' : 'text-muted-foreground border-border/30'}`}>
                      {myScore > oppScore ? '▲ LEADING' : myScore === oppScore ? '= TIE' : '▼ TRAILING'}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="font-display text-4xl font-black text-destructive"
                    >
                      VS
                    </motion.div>
                    {matchState === 'finished' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`mt-4 font-display text-lg tracking-widest uppercase ${myScore > oppScore ? 'text-accent neon-text-green' : myScore === oppScore ? 'text-foreground' : 'text-destructive'}`}
                      >
                        {myScore > oppScore ? '🏆 VICTORY' : myScore === oppScore ? 'DRAW' : '💀 DEFEAT'}
                      </motion.div>
                    )}
                  </div>

                  {/* OPPONENT */}
                  <div className="text-center space-y-4">
                    <div className="text-[10px] font-display tracking-[0.3em] text-destructive uppercase">{opponent.codename}</div>
                    <div className="text-5xl font-display font-black text-destructive">{opponentReps}</div>
                    <div className="text-[8px] font-display text-muted-foreground uppercase">REPS</div>
                    <div className="text-sm font-display text-foreground">{opponentCalories} KCAL</div>
                    <div className={`text-xs font-display px-3 py-1 rounded-full border ${oppScore > myScore ? 'text-destructive border-destructive/30 bg-destructive/10' : 'text-muted-foreground border-border/30'}`}>
                      LVL {opponent.level} // {opponent.syncPoints.toLocaleString()} SP
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-border/50 p-8 md:p-16 mb-12 group">
          <div className="absolute inset-0 parallax-grid opacity-[0.2]" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05)_0%,transparent_70%)] animate-pulse" />

          <div className="relative z-10 text-center space-y-6">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <div className="inline-flex items-center gap-3 bg-card/60 backdrop-blur-xl border border-primary/20 rounded-full px-6 py-2 mb-4">
                <Sword className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-[10px] font-display tracking-[0.4em] uppercase text-primary">Global_Conflict_Active</span>
              </div>
              <h1 className="font-display text-4xl md:text-7xl font-black uppercase tracking-tight leading-none">
                The_<span className="text-secondary neon-text-green">Arena</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mt-6 leading-relaxed uppercase">
                Connect your bio-link to the global nexus. Compete with top-tier operators and claim your position in the elite hierarchy.
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6 pt-6">
              {matchState === 'idle' && (
                <Button
                  size="lg"
                  onClick={handleJoinMatchmaking}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-8 font-display tracking-[0.3em] text-[10px] group relative overflow-hidden neon-glow-blue shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                >
                  <span className="relative z-10 uppercase flex items-center gap-3">
                    <Wifi className="w-4 h-4" />
                    Initialize_Matchmaking
                  </span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Button>
              )}
              {matchState === 'searching' && (
                <Button
                  size="lg"
                  disabled
                  className="bg-primary/20 text-primary border border-primary/30 px-12 py-8 font-display tracking-[0.3em] text-[10px]"
                >
                  <Loader2 className="w-4 h-4 animate-spin mr-3" />
                  SCANNING_GLOBAL_NEXUS...
                </Button>
              )}
              {(matchState === 'matched' || matchState === 'finished') && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleLeaveMatch}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 px-12 py-8 font-display tracking-[0.3em] text-[10px]"
                >
                  <WifiOff className="w-4 h-4 mr-3" />
                  DISENGAGE_PROTOCOL
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="font-display text-sm tracking-[0.3em] uppercase flex items-center gap-3">
                <Trophy className="w-4 h-4 text-primary" /> Sector_Rankings
              </h3>
              <div className="text-[8px] font-display tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
                {loading ? "Syncing_Neural_Net..." : "Live_Syncing..."}
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-[10px] font-display tracking-[0.4em] text-muted-foreground uppercase animate-pulse">Downloading_Sector_Data...</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="holographic-card rounded-2xl p-16 hud-border text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="font-display text-[10px] tracking-[0.4em] text-muted-foreground uppercase">No_Operators_Ranked_Yet // Be_First</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {leaderboard.map((p, i) => (
                    <RankCard key={p.userId} player={p} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="space-y-8">
            {/* Combat Readiness */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="holographic-card rounded-2xl p-8 hud-border"
            >
              <div className="flex items-center gap-3 mb-8">
                <Shield className="w-5 h-5 text-accent" />
                <h3 className="font-display text-[10px] tracking-[0.3em] uppercase">Combat_Readiness</h3>
              </div>
              <div className="space-y-10">
                {[
                  { label: "Strength_Index", val: profile?.attributes?.strength || 0, color: "bg-primary" },
                  { label: "Agility_Index", val: profile?.attributes?.agility || 0, color: "bg-accent" },
                  { label: "Endurance_Matrix", val: profile?.attributes?.endurance || 0, color: "bg-primary" },
                ].map(r => (
                  <div key={r.label} className="group cursor-crosshair">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-display tracking-widest text-muted-foreground group-hover:text-foreground transition-colors uppercase">{r.label}</span>
                      <span className="text-[10px] font-display text-primary">{r.val}/100</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${r.val}%` }}
                        className={`h-full ${r.color} relative`}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 p-5 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <div className="text-[8px] font-display tracking-[0.3em] text-primary/60 mb-2 uppercase">Current_Mission_Streak</div>
                <div className="text-3xl font-display text-primary flex items-center justify-center gap-3">
                  <Flame className="w-5 h-5 text-accent animate-bounce" />
                  {profile?.streak || 0}_CYCLES
                </div>
              </div>
            </motion.div>

            {/* Active Operators */}
            <div className="holographic-card rounded-2xl p-8 hud-border text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="font-display text-[10px] tracking-[0.4em] text-muted-foreground mb-6 uppercase">Active_Operators</div>
              <div className="flex justify-center gap-2 mb-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 16, 4], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 bg-accent rounded-full"
                  />
                ))}
              </div>
              <div className="text-xs font-display tracking-widest text-foreground uppercase">
                {activeStats.operators}_OPERATORS_READY
              </div>
              <div className="mt-4 text-[8px] font-display tracking-widest text-primary/60 uppercase">
                {matchState === 'searching' ? 'LOCATING_ADVERSARY...' : matchState === 'matched' ? 'DUEL_IN_PROGRESS' : 'STANDBY_FOR_CONFLICT'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
