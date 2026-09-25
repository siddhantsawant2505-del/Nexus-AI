# NexusAI: The Synthetic Laboratory

NexusAI is a premium, high-performance biometric tracking and AI-driven athletic diagnostic platform. It leverages state-of-the-art computer vision and neural synchronization to provide real-time biomechanical analysis and metabolic optimization.

## 🧪 Project Vision
The system is built on the **"Bio_Tech_Performance" (The Synthetic Laboratory)** design system—a high-fidelity HUD interface designed for elite operators and professional athletes. It prioritizes data density, real-time telemetry, and a professional, laboratory-grade aesthetic.

## 📂 Project Architecture

The NexusAI ecosystem is composed of three primary microservices:

1.  **[Client](./client)**: The React-based frontend HUD. Powered by **Vite**, **Tailwind CSS**, and **Framer Motion**.
2.  **[Server](./server)**: The Node.js/Express backend orchestration layer. Manages authentication, biometric profiles, workout sessions, and nutritional logs using **MongoDB**.
3.  **ML Services**: Python-based computer vision and neural processing engine (Skeletal tracking & Kinetic analysis).

## 🚀 Full-Stack Deployment

To launch the full NexusAI ecosystem in a unified tactical environment:

### 1. Initialization
From the root directory, install all required dependencies:

```bash
npm run install:all
```

### 2. Strategic Configuration
Ensure the following protocol-linked environment variables are active:

- **Client (`/client/.env`)**:
  - `VITE_API_BASE_URL=http://localhost:5000/api/v1`
- **Server (`/server/.env`)**:
  - `MONGODB_URI` (Your MongoDB connection string)
  - `JWT_SECRET` (For cryptographic identity encoding)
  - `ML_SERVICE_URL` (For AI engine integration)

### 3. Biometric Seeding (Optional)
To populate the Tactical Mission Archive with preset workout protocols:

```bash
npm run seed
```

### 4. System Launch
Launch the synchronized HUD and Backend services:

```bash
npm run dev
```

The interface will be available at `http://localhost:8080`, and the API gateway will be active at `http://localhost:5000`.

## 📡 Core Protocols

- **Biometric Studio**: Real-time skeletal tracking and kinetic power analysis.
- **Neural Link**: XP-based progression and performance diagnostics.
- **Bio-Fuel Optimizer**: Molecular-level nutrition and macros calibration.
- **The Arena**: Global telemetry synchronization and leaderboard ranks.

---
© 2026 Nexus Fit OS | Bio-Tech Security Protocol Enforced.
