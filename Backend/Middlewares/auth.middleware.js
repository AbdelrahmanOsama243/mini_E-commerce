const jwtServices = require('../Utils/jwtGenerate');
const UserRepo = require('../Repos/User.Repo');
const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');

const authentication = asyncHandler(async (req, res, next) => {
  const token = jwtServices.extractToken(req.headers.authorization);

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token or malformed Bearer token');
  }

  const decoded = jwtServices.verifyAccessToken(token);

  req.user = await UserRepo.findUserById(decoded.id);

  if (!req.user) {
    throw new ApiError(401, 'Not authorized, user not found');
  }

  if (req.user.status !== 'active') {
    throw new ApiError(403, 'Account is not active');
  }

  req.token = token;
  next();
});

module.exports = { authentication };
