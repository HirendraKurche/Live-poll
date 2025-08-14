const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  room: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    index: true
  },
  socketId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  },
  polls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);