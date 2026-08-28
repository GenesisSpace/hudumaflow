require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

connectDB();

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