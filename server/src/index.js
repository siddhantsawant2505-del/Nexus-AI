require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports are now handled directly in app.use()
const mlRoutes = require('./routes/ml.routes');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — slow down, operator.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts — try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/v1/auth', authLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'NEXUSAI_SERVER_ONLINE',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/profile', require('./routes/profile.routes'));
app.use('/api/v1/workouts', require('./routes/workout.routes'));
app.use('/api/v1/templates', require('./routes/template.routes'));
app.use('/api/v1/progress', require('./routes/progress.routes'));
app.use('/api/v1/nutrition', require('./routes/nutrition.routes'));
app.use('/api/v1/arena', require('./routes/arena.routes'));
app.use('/api/v1/vault', require('./routes/vault.routes'));

// ─── ML Service Proxy ────────────────────────────────────────────────────────
// Proxies /api/v1/ml/* → ML_SERVICE_URL/*  (requires JWT)
app.use('/api/v1/ml', mlRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Arena Matchmaking via Socket.io ─────────────────────────────────────────
const matchmakingQueue = [];
const activeMatches = new Map();

const CODENAMES = ['GHOST_OPS', 'PHANTOM_ALPHA', 'IRON_SIGMA', 'NEXUS_WOLF', 'STEALTH_NOVA', 'TITAN_ECHO', 'CIPHER_X', 'VORTEX_ONE'];
const randomCodename = () => CODENAMES[Math.floor(Math.random() * CODENAMES.length)];
const randomStat = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

io.on('connection', (socket) => {
  console.log(`[ARENA] Operator connected: ${socket.id}`);

  socket.on('join_matchmaking', ({ codename, level, syncPoints }) => {
    console.log(`[ARENA] ${codename || socket.id} entered matchmaking queue`);

    const player = { socketId: socket.id, codename: codename || randomCodename(), level: level || 1, syncPoints: syncPoints || 0 };
    matchmakingQueue.push(player);
    socket.emit('matchmaking_status', { status: 'SEARCHING', position: matchmakingQueue.length });

    // Try to pair after a short delay
    setTimeout(() => {
      const idx = matchmakingQueue.findIndex(p => p.socketId === socket.id);
      if (idx === -1) return; // already matched

      if (matchmakingQueue.length >= 2) {
        // Pair first two in queue
        const p1 = matchmakingQueue.shift();
        const p2 = matchmakingQueue.shift();
        const matchId = `match_${Date.now()}`;

        const opponent1 = { codename: p2.codename, level: p2.level, syncPoints: p2.syncPoints, reps: 0, calories: 0 };
        const opponent2 = { codename: p1.codename, level: p1.level, syncPoints: p1.syncPoints, reps: 0, calories: 0 };

        activeMatches.set(p1.socketId, { matchId, opponentSocketId: p2.socketId });
        activeMatches.set(p2.socketId, { matchId, opponentSocketId: p1.socketId });

        io.to(p1.socketId).emit('match_found', { matchId, opponent: opponent1 });
        io.to(p2.socketId).emit('match_found', { matchId, opponent: opponent2 });
      } else {
        // No pair found — match vs a simulated AI opponent
        matchmakingQueue.splice(matchmakingQueue.findIndex(p => p.socketId === socket.id), 1);
        const aiOpponent = { codename: randomCodename(), level: randomStat(1, 10), syncPoints: randomStat(100, 5000), reps: 0, calories: 0 };
        const matchId = `match_ai_${Date.now()}`;
        activeMatches.set(socket.id, { matchId, opponentSocketId: 'AI', aiOpponent });
        socket.emit('match_found', { matchId, opponent: aiOpponent });

        // Simulate AI doing reps live
        const aiInterval = setInterval(() => {
          if (!activeMatches.has(socket.id)) { clearInterval(aiInterval); return; }
          aiOpponent.reps += 1;
          aiOpponent.calories = Math.floor(aiOpponent.reps * 2.5);
          socket.emit('opponent_update', { reps: aiOpponent.reps, calories: aiOpponent.calories });
        }, randomStat(3000, 7000));
        socket.once('leave_match', () => clearInterval(aiInterval));
        socket.once('disconnect', () => clearInterval(aiInterval));
      }
    }, 3000);
  });

  socket.on('rep_update', ({ reps, calories }) => {
    const match = activeMatches.get(socket.id);
    if (!match || match.opponentSocketId === 'AI') return;
    io.to(match.opponentSocketId).emit('opponent_update', { reps, calories });
  });

  socket.on('leave_match', () => {
    activeMatches.delete(socket.id);
    const queueIdx = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (queueIdx > -1) matchmakingQueue.splice(queueIdx, 1);
    console.log(`[ARENA] Operator left: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    activeMatches.delete(socket.id);
    const queueIdx = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (queueIdx > -1) matchmakingQueue.splice(queueIdx, 1);
    console.log(`[ARENA] Operator disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  console.log(`\n[SERVER] NexusAI API running on http://localhost:${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] ML Proxy target: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
  console.log(`[SERVER] Arena Socket.io: ACTIVE\n`);
});

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error('[SERVER] Unhandled rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});
