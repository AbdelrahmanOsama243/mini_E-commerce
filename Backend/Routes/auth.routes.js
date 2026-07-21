const express = require('express');
const router = express.Router();
const authController = require('../Controllers/Auth.Controller');
const { authentication } = require('../Middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authentication, authController.getMe);

module.exports = router;
