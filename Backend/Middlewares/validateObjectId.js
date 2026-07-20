const mongoose = require('mongoose');

/**
 * Validates ObjectId fields in req.params, req.body, or req.query
 * @param {string[]} fields - Array of field names to validate
 * @param {string} source - 'params' | 'body' | 'query' | 'all'
 */
const validateObjectId = (fields = ['id'], source = 'all') => {
  const sources = source === 'all' ? ['params', 'body', 'query'] : [source];
  
  return (req, res, next) => {
    for (const field of fields) {
      for (const src of sources) {
        const value = req[src]?.[field];
        if (value && !mongoose.isValidObjectId(value)) {
          return res.status(400).json({
            success: false,
            message: `Invalid ObjectId format for '${field}' in ${src}`,
            received: value
          });
        }
      }
    }
    next();
  };
};

module.exports = { validateObjectId };
