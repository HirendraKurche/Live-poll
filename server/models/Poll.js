const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  room: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowMultipleAnswers: {
    type: Boolean,
    default: false
  },
  responses: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    studentName: String,
    selectedOptions: [String],
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalResponses: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
pollSchema.index({ teacher: 1 });
pollSchema.index({ room: 1 });
pollSchema.index({ isActive: 1 });
pollSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Poll', pollSchema);
