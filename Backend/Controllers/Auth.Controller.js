const UserRepo = require('../Repos/User.Repo');
const jwtServices = require('../Utils/jwtGenerate');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }

    const userExists = await UserRepo.findUserByEmail(email);
    if (userExists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await UserRepo.registerUser({ name, email, password });
    
    const { accessToken, refreshToken } = await jwtServices.generateTokenPair(user._id);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await UserRepo.findUserByEmail(email);

    if (user && (await UserRepo.comparePassword(password, user.password))) {
      const { accessToken, refreshToken } = await jwtServices.generateTokenPair(user._id);

      res.status(200).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    // If you pass the refreshToken in body:
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await jwtServices.revokeRefreshToken(refreshToken);
    } else if (req.user) {
      // Optional: revoke all tokens for user if no specific token provided
      await jwtServices.revokeAllRefreshTokens(req.user._id);
    }
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  register,
  login,
  logout,
};
