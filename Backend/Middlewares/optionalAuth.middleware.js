const jwtServices = require("../Utils/jwtGenerate");
const UserRepo = require("../Repos/User.Repo");
const asyncHandler = require("../Utils/asyncHandler");

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token =
    jwtServices.extractToken(req.headers.authorization) ||
    req.session?.accessToken;

  if (token) {
    try {
      const decoded = jwtServices.verifyAccessToken(token);
      const user = await UserRepo.findUserById(decoded.id);

      if (user && user.status === "active") {
        req.user = user;
        req.token = token;
      }
    } catch (err) {
      // Ignore token errors for optional auth (treat as guest)
    }
  }

  // Proceed whether req.user is set or not
  next();
});

module.exports = { optionalAuth };
