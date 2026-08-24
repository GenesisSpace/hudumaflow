const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },        // e.g. "Tigo Pesa", "Airtel Money", "Bank Account"
    accountName: { type: String, required: true },   // name on the account
    accountNumber: { type: String, required: true }, // phone number, lipa namba, or bank account number
    instructions: { type: String, default: '' },      // e.g. "Send exact fee, then submit your reference"
    supportPhone: { type: String, default: '' },       // contact number if payment has issues
    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);