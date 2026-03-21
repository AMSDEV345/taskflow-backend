const express = require('express');
const Board = require('../models/Board');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all boards for current user
router.get('/', protect, async (req, res) => {
  try {
    const boards = await Board.find({ members: req.user._id }).populate('members', '-password');
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single board
router.get('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate('members', '-password');
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!board.members.some(m => m._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create board
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, color } = req.body;
    const board = await Board.create({
      title, description, color,
      owner: req.user._id,
      members: [req.user._id],
      lists: [
        { title: 'To Do', color: '#60a5fa', tasks: [] },
        { title: 'In Progress', color: '#fbbf24', tasks: [] },
        { title: 'Done', color: '#4ade80', tasks: [] },
      ],
    });
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update board
router.put('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete board
router.delete('/:id', protect, async (req, res) => {
  try {
    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: 'Board deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add member to board
router.post('/:id/members', protect, async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: req.body.userId } },
      { new: true }
    ).populate('members', '-password');
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Lists ─────────────────────────────────────────────────

// Add list
router.post('/:id/lists', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    board.lists.push({ title: req.body.title, color: req.body.color || '#7c6fff', tasks: [] });
    await board.save();
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update list
router.put('/:id/lists/:listId', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    const list = board.lists.id(req.params.listId);
    if (!list) return res.status(404).json({ message: 'List not found' });
    if (req.body.title) list.title = req.body.title;
    if (req.body.color) list.color = req.body.color;
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete list
router.delete('/:id/lists/:listId', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    board.lists.id(req.params.listId).deleteOne();
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Tasks ─────────────────────────────────────────────────

// Add task
router.post('/:id/lists/:listId/tasks', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    const list = board.lists.id(req.params.listId);
    list.tasks.push({ ...req.body, assignees: [req.user._id] });
    await board.save();
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update task
router.put('/:id/lists/:listId/tasks/:taskId', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    const list = board.lists.id(req.params.listId);
    const task = list.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    Object.assign(task, req.body);
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete task
router.delete('/:id/lists/:listId/tasks/:taskId', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    board.lists.id(req.params.listId).tasks.id(req.params.taskId).deleteOne();
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Move task between lists
router.put('/:id/tasks/:taskId/move', protect, async (req, res) => {
  try {
    const { fromListId, toListId } = req.body;
    const board = await Board.findById(req.params.id);
    const fromList = board.lists.id(fromListId);
    const toList = board.lists.id(toListId);
    const task = fromList.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const taskData = task.toObject();
    task.deleteOne();
    toList.tasks.push(taskData);
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment to task
router.post('/:id/lists/:listId/tasks/:taskId/comments', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    const task = board.lists.id(req.params.listId).tasks.id(req.params.taskId);
    task.comments.push({ userId: req.user._id, text: req.body.text });
    await board.save();
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;