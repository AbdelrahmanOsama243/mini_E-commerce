const express = require("express");
const userController = require("../Controllers/Auth.Controller");
const { authentication } = require("../Middlewares/auth.middleware");
const { validateZod, authSchemas } = require("../Middlewares/zodValidator");
// You can also use Joi by uncommenting the next line and changing validateZod to validateJoi
// const { validateJoi, authSchemas } = require("../Middlewares/joiValidator");

const router = express.Router();

router.post("/register", validateZod(authSchemas.register), userController.register);
router.post("/login", validateZod(authSchemas.login), userController.login);
router.post("/logout", userController.logout);
router.post("/refresh", userController.refresh);
router.post("/forget-password", validateZod(authSchemas.forgetPassword), userController.forgetPassword);
router.get("/me", authentication, userController.getMe);
router.put("/me", authentication, validateZod(authSchemas.updateUserProfile), userController.updateUserProfile);
router.get("/verify-email/:token", userController.verifyEmail);
router.post("/resend-verification", userController.resendVerification);

module.exports = router;
