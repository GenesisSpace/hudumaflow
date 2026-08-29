const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateOtp = require('../utils/generateOtp');
const sendEmail = require('../utils/sendEmail');


// POST /api/customer/register
exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const user = await User.create({
      fullName,
      email,
      phone,
      passwordHash,
      otpCode,
      otpExpiresAt,
    });

    // Don't block the response on the email send — a slow/stalled SMTP
    // connection would otherwise hang this whole request. The account is
    // already created either way; log failures instead of failing registration.
    sendEmail({
      to: email,
      subject: 'Your HudumaFlow verification code',
      text: `Your OTP code is ${otpCode}. It expires in 10 minutes.`,
    }).catch((err) => {
      console.error(`Failed to send OTP email to ${email}:`, err.message);
    });

    res.status(201).json({
      message: 'Registered successfully. Check your email for the OTP code.',
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// POST /api/customer/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { userId, otpCode } = req.body;

    const user = await User.findById(userId).select('+otpCode +otpExpiresAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.otpCode !== otpCode) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired, please request a new one' });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({ message: 'Account verified successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};

// POST /api/customer/resend-otp
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Akaunti haikupatikana' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Akaunti hii tayari imethibitishwa' });
    }

    const otpCode = generateOtp();
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Unlike register(), this IS awaited: it's a manual "resend" click, so the
    // customer is actively waiting to know whether it actually went out.
    try {
      await sendEmail({
        to: email,
        subject: 'Your HudumaFlow verification code',
        text: `Your OTP code is ${otpCode}. It expires in 10 minutes.`,
      });
      res.json({ message: 'Msimbo mpya umetumwa kwenye barua pepe yako.' });
    } catch (err) {
      console.error(`Failed to resend OTP email to ${email}:`, err.message);
      res.status(502).json({ message: 'Imeshindwa kutuma barua pepe. Jaribu tena baadaye.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend OTP', error: err.message });
  }
};

// GET /api/customer/admin/list  (admin - list all registered customers)
exports.listCustomersAdmin = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await User.find(filter)
      .select('-passwordHash -otpCode -otpExpiresAt')
      .sort({ createdAt: -1 });

    const Application = require('../models/Application');
    const customerIds = customers.map((c) => c._id);
    const applications = await Application.find({ customer: { $in: customerIds } })
      .populate('service', 'name')
      .select('customer service trackingId status');

    const appsByCustomer = {};
    applications.forEach((app) => {
      const key = app.customer.toString();
      if (!appsByCustomer[key]) appsByCustomer[key] = [];
      appsByCustomer[key].push({
        trackingId: app.trackingId,
        service: app.service ? app.service.name : '',
        status: app.status,
      });
    });

    const result = customers.map((c) => ({
      id: c._id,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      isVerified: c.isVerified,
      isActive: c.isActive,
      createdAt: c.createdAt,
      applications: appsByCustomer[c._id.toString()] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers', error: err.message });
  }
};

// PATCH /api/customer/admin/:id/disable
exports.disableCustomer = async (req, res) => {
  const customer = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('-passwordHash -otpCode -otpExpiresAt');
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
};

// PATCH /api/customer/admin/:id/enable
exports.enableCustomer = async (req, res) => {
  const customer = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  ).select('-passwordHash -otpCode -otpExpiresAt');
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your account before logging in' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account disabled' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};