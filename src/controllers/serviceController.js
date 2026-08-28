const Service = require('../models/Service');

// POST /api/services (admin only)
exports.createService = async (req, res) => {
  try {
    const service = await Service.create({
      ...req.body,
      createdBy: req.adminId,
    });
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create service', error: err.message });
  }
};

// GET /api/services (public - customers will browse these)
exports.listServices = async (req, res) => {
  const services = await Service.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(services);
};

// GET /api/services/admin/all (admin - includes inactive services)
exports.listAllServicesAdmin = async (req, res) => {
  const services = await Service.find().sort({ createdAt: -1 });
  res.json(services);
};

// PUT /api/services/:id (admin - update)
exports.updateService = async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
};

// PATCH /api/services/:id/disable (admin - disable when deadline passes)
exports.disableService = async (req, res) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
};

// PATCH /api/services/:id/enable (admin - re-enable a disabled service)
exports.enableService = async (req, res) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  );
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
};