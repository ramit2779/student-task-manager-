const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { validateTask } = require('../middleware/validate');

const router = express.Router();

// In-memory resource store — swap for MongoDB by replacing this array with Mongoose calls
let tasks = [
  {
    id: uuidv4(),
    title: 'Deploy ECS Fargate Service',
    subject: 'ECS',
    priority: 'high',
    dueDate: '2026-05-01',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Configure ALB Health Checks',
    subject: 'ALB',
    priority: 'high',
    dueDate: '2026-05-03',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Setup CloudWatch Log Groups',
    subject: 'CloudWatch',
    priority: 'medium',
    dueDate: '2026-05-10',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Apply Terraform VPC Module',
    subject: 'Terraform',
    priority: 'medium',
    dueDate: '2026-05-07',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Push Docker Image to ECR',
    subject: 'ECR',
    priority: 'low',
    dueDate: '2026-05-15',
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
  if (!task) return res.status(404).json({ success: false, error: 'Resource not found' });
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

// PATCH /api/tasks/:id — update fields or toggle deployment status
router.patch('/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Resource not found' });

  tasks[index] = { ...tasks[index], ...req.body, id: tasks[index].id };
  res.json({ success: true, data: tasks[index] });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Resource not found' });

  tasks.splice(index, 1);
  res.json({ success: true, message: 'Resource removed from monitoring' });
});

module.exports = router;
