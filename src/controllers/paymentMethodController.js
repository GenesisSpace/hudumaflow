const PaymentMethod = require('../models/PaymentMethod');

//  (public - customer sees active payment options)
exports.listActiveMethods = async (req, res) => {
  const methods = await PaymentMethod.find({ isActive: true });
  res.json(methods);
};

// (admin only)
exports.createMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.create({ ...req.body, createdBy: req.adminId });
    res.status(201).json(method);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create payment method', error: err.message });
  }
};

// (admin only)
exports.updateMethod = async (req, res) => {
  const method = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!method) return res.status(404).json({ message: 'Payment method not found' });
  res.json(method);
};

//  (admin - sees inactive ones too)
exports.listAllMethodsAdmin = async (req, res) => {
  const methods = await PaymentMethod.find();
  res.json(methods);
};