import { Router } from "express";

import { protect, isAdmin } from "../middleware/authMiddleware.js";

import {signup, verifyOtp, login, forgotPassword, resetPassword} from "../controllers/authController.js"

const router = Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Example protected route
router.get("/admin-only", protect, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

export default router;


