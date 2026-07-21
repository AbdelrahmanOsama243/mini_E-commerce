const express = require("express");
const userController = require("../Controllers/Auth.Controller");
const { authentication } = require("../Middlewares/auth.middleware");

const router = express.Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", authentication, userController.getMe);
router.put("/me", authentication, userController.updateUserProfile);

module.exports = router;
