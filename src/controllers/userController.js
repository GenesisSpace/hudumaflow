const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    const user = await User.create({
      fullName,
      email,
      phone,
      passwordHash,
    });

    res.status(201).json({
      message: 'Registered successfully. You can now log in.',
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
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
      .select('-passwordHash')
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
  try {
    const customer = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-passwordHash');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to disable customer', error: err.message });
  }
};

// PATCH /api/customer/admin/:id/enable
exports.enableCustomer = async (req, res) => {
  try {
    const customer = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-passwordHash');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to enable customer', error: err.message });
  }
};

// POST /api/customer/login
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