const express = require("express");
const userController = require("../Controllers/Auth.Controller");
const { authentication } = require("../Middlewares/auth.middleware");

const router = express.Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/refresh", userController.refresh);
router.post("/forget-password", userController.forgetPassword);
router.get("/me", authentication, userController.getMe);
router.put("/me", authentication, userController.updateUserProfile);
router.get("/verify-email/:token", userController.verifyEmail);
router.post("/resend-verification", userController.resendVerification);

module.exports = router;
