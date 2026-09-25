# 🦾 NexusAI Backend Engine

The core intelligence and orchestration layer for the NexusAI bio-tech performance platform. Built with a focus on security, scalability, and seamless integration with machine learning diagnostic protocols.

## 🚀 Technology Stack

- **Core**: Node.js & Express.js (v4+)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) & BcryptJS
- **Validation**: Zod (Schema-based validation)
- **Security**: Helmet, CORS, and Express Rate Limiting
- **Logging**: Morgan (Development/Production modes)
- **Proxy**: Integrated ML Service Proxy via `http-proxy-middleware`

## 🏗️ Architecture

The server follows a modular, controller-based architecture for clean separation of concerns:

```text
server/
├── src/
│   ├── config/       # Database & service configurations
│   ├── controllers/  # Request handlers & business logic
│   ├── middleware/   # Custom Express middlewares (Auth, Error)
│   ├── models/       # Mongoose schemas & data models
│   ├── routes/       # API route definitions
│   └── index.js      # Server entry point & orchestration
├── .env              # Environment configuration (ignored)
└── package.json      # Dependencies & scripts
```

## 🔌 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Sub-dermal identity registration
- `POST /login` - Neural handshake & token issuance
- `GET /me` - Current operator diagnostics

### Biological Data
- `/api/v1/profile` - User biometric profiles
- `/api/v1/workouts` - Session telemetry & physical logs
- `/api/v1/nutrition` - Nutrient intake & supplement tracking
- `/api/v1/progress` - Long-term performance analytics

### Advanced Systems
- `/api/v1/arena` - Competitive protocols & ranking
- `/api/v1/vault` - Encrypted record storage
- `/api/ml/*` - Proxied requests to the Python AI Engine

## ⚙️ Configuration

Create a `.env` file in the root of the `/server` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_hex_string
JWT_EXPIRES_IN=100y  # Set to "never" for local development
ML_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:8080
NODE_ENV=development
```

## 🛠️ Development

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### Setup
1. `npm install`
2. Configure `.env`
3. `npm run dev` (Starts server with Nodemon)

### Production
- `npm start` (Standard Node.js execution)

## 🛡️ Security Protocols

- **Rate Limiting**: Protects against brute-force attacks on auth and API endpoints.
- **Security Headers**: Implemented via Helmet.
- **Encryption**: Standard-grade hashing for passwords.
- **Graceful Shutdown**: Handles `SIGTERM` and `unhandledRejection` to ensure data integrity during termination.

---
**Status**: `ONLINE` | **Version**: `1.0.0`
