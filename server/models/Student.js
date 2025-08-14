const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  room: {
    type: String,
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  responses: [{
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll'
    },
    answer: String,
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
studentSchema.index({ room: 1 });
studentSchema.index({ socketId: 1 });
studentSchema.index({ teacher: 1 });

module.exports = mongoose.model('Student', studentSchema);
