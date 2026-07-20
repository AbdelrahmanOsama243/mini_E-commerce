const asyncHandler = (fn, mapErr) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (req.logger && req.logger.error) {
      req.logger.error({ err, path: req.path }, 'asyncHandler error');
    }
    next(mapErr ? mapErr(err) : err);
  });

module.exports = asyncHandler;
module.exports.asyncHandler = asyncHandler;
