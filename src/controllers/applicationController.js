const Application = require('../models/Application');
const Service = require('../models/Service');
const User = require('../models/User');
const generateTrackingId = require('../utils/generateTrackingId');
const supabase = require('../config/supabaseClient');

// (customer submits a new application)
exports.submitApplication = async (req, res) => {
  try {
    const { serviceId, formData } = req.body;

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(400).json({ message: 'Service not available' });
    }

    const trackingId = await generateTrackingId();

    const application = await Application.create({
      trackingId,
      customer: req.userId,
      service: service._id,
      formData,
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ message: 'Failed to submit application', error: err.message });
  }
};

// (customer's own applications)
exports.myApplications = async (req, res) => {
  const applications = await Application.find({ customer: req.userId })
    .populate('service', 'name category feeAmount')
    .sort({ createdAt: -1 });
  res.json(applications);
};

// GET /api/applications/stats/summary  (admin - dashboard totals)
exports.getDashboardStats = async (req, res) => {
  try {
    const statusCounts = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const revenueAgg = await Application.aggregate([
      { $match: { 'payment.status': 'Paid' } },
      { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $group: { _id: null, total: { $sum: '$service.feeAmount' } } },
    ]);

    const counts = { Submitted: 0, Pending: 0, 'In Progress': 0, Completed: 0 };
    statusCounts.forEach((s) => {
      if (counts[s._id] !== undefined) counts[s._id] = s.count;
    });

    res.json({
      totalRevenue: revenueAgg[0]?.total || 0,
      pending: counts['Pending'],
      inProgress: counts['In Progress'],
      completed: counts['Completed'],
      submitted: counts['Submitted'],
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard stats', error: err.message });
  }
};

// (admin - create an application on behalf of an already-registered customer)
exports.createApplicationAdmin = async (req, res) => {
  try {
    const { customerPhone, serviceId, formData } = req.body;

    if (!customerPhone || !serviceId) {
      return res.status(400).json({ message: 'customerPhone and serviceId are required' });
    }

    const customer = await User.findOne({ phone: customerPhone.trim() });
    if (!customer) {
      return res.status(404).json({
        message: 'Hakuna mteja aliyesajiliwa na namba hiyo ya simu. Mteja lazima ajisajili kwanza kwenye app.',
      });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(400).json({ message: 'Service not available' });
    }

    const trackingId = await generateTrackingId();

    const application = await Application.create({
      trackingId,
      customer: customer._id,
      service: service._id,
      formData: formData || {},
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create application', error: err.message });
  }
};

// (admin - list all, with optional filters)
exports.listApplicationsAdmin = async (req, res) => {
  const { status, serviceId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (serviceId) filter.service = serviceId;

  const applications = await Application.find(filter)
    .populate('customer', 'fullName email phone')
    .populate('service', 'name category feeAmount')
    .sort({ createdAt: -1 });

  res.json(applications);
};

// (admin - move it through the pipeline)
exports.updateStatus = async (req, res) => {
  const { status } = req.body;

  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  res.json(application);
};

// (admin - approve or reject; auto-advances status)
exports.decideApplication = async (req, res) => {
  const { decision, comment } = req.body;

  const application = await Application.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

   application.decision = decision;

  // Auto-advance the status based on the decision
  if (decision === 'Approved') {
    application.status = 'In Progress';
  } else if (decision === 'Rejected') {
    application.status = 'Completed';
  }

  if (comment) {
    application.adminComments.push({ comment });
  }
  await application.save();

  res.json(application);
};

// (customer uploads a document)
exports.uploadDocument = async (req, res) => {
  try {
    const { label } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only the owning customer can upload to their own application
    if (application.customer.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized for this application' });
    }

    const fileName = `${application.trackingId}/${Date.now()}_${file.originalname}`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) {
      return res.status(500).json({ message: 'Upload failed', error: error.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    application.documents.push({
      label: label || file.originalname,
      fileUrl: publicUrlData.publicUrl,
    });
    await application.save();

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// (admin uploads a document on behalf of a customer, e.g. from "Ongeza Ombi Jipya")
exports.uploadDocumentAdmin = async (req, res) => {
  try {
    const { label } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const fileName = `${application.trackingId}/${Date.now()}_${file.originalname}`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) {
      return res.status(500).json({ message: 'Upload failed', error: error.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    application.documents.push({
      label: label || file.originalname,
      fileUrl: publicUrlData.publicUrl,
    });
    await application.save();

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// (customer submits payment info after paying manually)
exports.submitPayment = async (req, res) => {
  try {
    const { method, reference } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.customer.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized for this application' });
    }

    application.payment.method = method;
    application.payment.reference = reference;
    application.payment.status = 'Pending';
    await application.save();

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit payment', error: err.message });
  }
};

// (admin confirms payment actually arrived)
exports.verifyPayment = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.payment.status = 'Paid';
    application.payment.paidAt = new Date();
    await application.save();

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify payment', error: err.message });
  }
};

// (public - no login required)
exports.trackByTrackingId = async (req, res) => {
  const application = await Application.findOne({ trackingId: req.params.trackingId })
    .populate('service', 'name category')
    .select('-adminComments'); // hide internal admin notes from public view

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  res.json(application);
};

// (admin - full detail view)
exports.getApplicationByIdAdmin = async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('customer', 'fullName email phone')
    .populate('service', 'name category feeAmount formSchema');

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  res.json(application);
};