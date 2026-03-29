// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // next parameter is required for Express error middleware even if unused
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    return res.status(404).json({ error: message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({ error: message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: message });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Server Error'
  });
};

module.exports = errorHandler;