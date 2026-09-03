require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Without these, any unguarded async error anywhere in the app (a missing
// try/catch around a DB call, a transient MongoDB hiccup, etc.) crashes the
// ENTIRE Node process — not just that one request — taking down every route
// until Render restarts it. This was causing widespread, intermittent
// "connection reset" failures across completely unrelated endpoints.
// unhandledRejection is safe to just log — it's almost always one bad async
// call (e.g. a DB query), not process-level corruption.
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// uncaughtException is different: per Node's own docs, the process is in an
// undefined state afterward, and continuing to run it can hang or corrupt
// things silently instead of crashing cleanly. So we log it AND exit —
// Render's process supervisor immediately restarts us fresh, the same
// self-healing behavior that was happening by default before, just without
// taking every other in-flight request down with an unlogged crash.
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION — restarting process:', err);
  process.exit(1);
});

const app = express();

connectDB();

// Origins allowed to call this API from a browser.
// Add your Vercel production/preview URL here once the customer portal is deployed.
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CUSTOMER_PORTAL_URL, // e.g. https://hudumaflow.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman) and any allowed browser origin.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));          
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/customer', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/admins', adminRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'HudumaFlow API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));