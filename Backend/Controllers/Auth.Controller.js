const UserRepo = require('../Repos/User.Repo');
const jwtServices = require('../Utils/jwtGenerate');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!password) return res.status(400).json({ message: 'Password is required' });

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

    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!password) return res.status(400).json({ message: 'Password is required' });

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
    
    if (!refreshToken && !req.user) {
      return res.status(400).json({ message: 'Refresh token or user session is required to logout' });
    }

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

const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated or not found' });
    }

    const { _id, name, email, role } = req.user;
    
    if (!_id || !name || !email) {
      return res.status(400).json({ message: 'User data is incomplete or invalid' });
    }

    res.status(200).json({ _id, name, email, role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { name, email } = req.body;
    const updateData = {};

    if (name) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters long' });
      }
      updateData.name = name.trim();
    }

    if (email) {
      const emailRegex = /^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      
      if (email !== req.user.email) {
        const userExists = await UserRepo.findUserByEmail(email);
        if (userExists) {
          return res.status(409).json({ message: 'Email already in use' });
        }
      }
      updateData.email = email.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const updatedUser = await UserRepo.update(req.user._id, updateData);

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateUserProfile,
};
