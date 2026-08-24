const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// GET /api/admins (list all admins)
exports.listAdmins = async (req, res) => {
  const admins = await Admin.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json(admins);
};

// POST /api/admins (create a new admin)
exports.createAdmin = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An admin with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await Admin.create({ fullName, email, phone, passwordHash });

    res.status(201).json({
      id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      phone: admin.phone,
      isActive: admin.isActive,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create admin', error: err.message });
  }
};

// PATCH /api/admins/:id/disable (disable an admin's access)
exports.disableAdmin = async (req, res) => {
  const admin = await Admin.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('-passwordHash');

  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  res.json(admin);
};

// PATCH /api/admins/:id/enable (re-enable an admin's access)
exports.enableAdmin = async (req, res) => {
  const admin = await Admin.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  ).select('-passwordHash');

  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  res.json(admin);
};