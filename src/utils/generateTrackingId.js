const Counter = require('../models/Counter');

async function generateTrackingId() {
  const year = new Date().getFullYear();
  const counterId = `HDF-${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(6, '0');
  return `HDF-${year}-${paddedSeq}`;
}

module.exports = generateTrackingId;