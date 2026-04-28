const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { validateTask } = require('../middleware/validate');

const router = express.Router();

// In-memory store — swap for MongoDB by replacing this array with Mongoose calls
let tasks = [
  {
    id: uuidv4(),
    title: 'Complete DevOps Assignment',
    subject: 'Cloud Computing',
    priority: 'high',
    dueDate: '2025-05-01',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Study Docker & Kubernetes',
    subject: 'System Administration',
    priority: 'medium',
    dueDate: '2025-05-10',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

// GET /api/tasks
router.get('/', (req, res) => {
  res.json({ success: true, data: tasks, total: tasks.length });
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  res.json({ success: true, data: task });
});

// POST /api/tasks
router.post('/', validateTask, (req, res) => {
  const { title, subject, priority, dueDate } = req.body;
  const task = {
    id: uuidv4(),
    title: title.trim(),
    subject: subject ? subject.trim() : '',
    priority: priority || 'medium',
    dueDate: dueDate || '',
    completed: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  res.status(201).json({ success: true, data: task });
});

// PATCH /api/tasks/:id — toggle complete or update fields
router.patch('/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Task not found' });

  tasks[index] = { ...tasks[index], ...req.body, id: tasks[index].id };
  res.json({ success: true, data: tasks[index] });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Task not found' });

  tasks.splice(index, 1);
  res.json({ success: true, message: 'Task deleted' });
});

module.exports = router;
