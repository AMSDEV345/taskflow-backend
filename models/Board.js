const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
  text: String,
  done: { type: Boolean, default: false },
});

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [String],
  dueDate: { type: Date },
  checklist: [checklistSchema],
  comments: [commentSchema],
  attachments: [String],
}, { timestamps: true });

const listSchema = new mongoose.Schema({
  title: { type: String, required: true },
  color: { type: String, default: '#7c6fff' },
  tasks: [taskSchema],
});

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#7c6fff' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lists: [listSchema],
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);