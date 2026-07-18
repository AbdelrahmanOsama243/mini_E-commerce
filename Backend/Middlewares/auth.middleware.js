const jwtServices = require('../Utils/jwtGenerate');
const UserRepo = require('../Repos/User.Repo');

const authentication = async (req, res, next) => {
  try {
    const token = jwtServices.extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwtServices.verifyAccessToken(token);

    // Add user to req
    req.user = await UserRepo.findUserById(decoded.id);

    if (!req.user) {
       return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { authentication };
