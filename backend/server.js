const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
const defaultOrigins = [
  'https://welfare-scheme-frontend.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

const envOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL)
  ? (process.env.CORS_ORIGINS || process.env.FRONTEND_URL).split(',').map(o => o.trim())
  : [];

const rawOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const allowedOrigins = rawOrigins.flatMap(o => {
  if (o === '*') return ['*'];
  if (o.startsWith('http://') || o.startsWith('https://')) return [o];
  return [`https://${o}`, `http://${o}`, o];
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const { seedInitialUsers } = require('./controllers/authController');

// Connect to Database and seed demo users
connectDB().then(() => {
  seedInitialUsers();
});

const { analyzeComplaintText } = require('./controllers/complaintController');

// API Routes
app.post('/api/ai/analyze-complaint', analyzeComplaintText);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/schemes', require('./routes/schemeRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

// Health check endpoints
const healthHandler = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Civic Welfare & Grievance Express Backend API',
    time: new Date().toISOString()
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.listen(PORT, () => {
  console.log(`[Express API] Civic Welfare & Grievance Server running on http://127.0.0.1:${PORT}`);
});

module.exports = app;
