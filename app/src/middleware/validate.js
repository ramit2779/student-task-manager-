const VALID_PRIORITIES = ['low', 'medium', 'high'];

function validateTask(req, res, next) {
  const { title, priority } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Task title is required' });
  }

  if (title.trim().length > 200) {
    return res.status(400).json({ success: false, error: 'Title must be under 200 characters' });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ success: false, error: 'Priority must be low, medium, or high' });
  }

  next();
}

module.exports = { validateTask };
