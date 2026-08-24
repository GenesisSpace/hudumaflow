const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },       // e.g. "National ID Copy"
    fileUrl: { type: String, required: true },       // Supabase Storage URL
    isVerified: { type: Boolean, default: false },
    adminComment: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },

    formData: { type: mongoose.Schema.Types.Mixed, default: {} },

    documents: [documentSchema],

    status: {
      type: String,
      enum: ['Submitted', 'Pending', 'In Progress', 'Completed'],
      default: 'Submitted',
    },
    decision: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },

    adminComments: [
      {
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    payment: {
  status: { type: String, enum: ['Unpaid', 'Pending', 'Paid'], default: 'Unpaid' },
  method: { type: String, default: '' },
  reference: { type: String, default: '' },
  paidAt: { type: Date },
},
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);