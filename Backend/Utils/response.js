const sendError = (res, statusCode, message, stack = null) => {
  const response = { success: false, message };
  if (stack && process.env.NODE_ENV !== 'production') {
    response.stack = stack;
  }
  return res.status(statusCode).json(response);
};

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

module.exports = { sendError, sendSuccess };
