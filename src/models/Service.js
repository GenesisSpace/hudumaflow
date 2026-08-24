const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'file', 'textarea'],
      required: true,
    },
    options: [String],
    required: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },        
    category: { type: String, required: true, trim: true },     
    description: { type: String, default: '' },

    requiredDocuments: [{ type: String }],           
    formSchema: [formFieldSchema],                   

    feeAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'TZS' },

    isActive: { type: Boolean, default: true },       
    applicationDeadline: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);