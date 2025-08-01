import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../../../middleware/requireAuth";

const router = Router();

// Public routes
router.post("/login", authController.login.bind(authController));
router.post("/refresh", authController.refresh.bind(authController));
router.post("/activate",  authController.activateUser.bind(authController));
router.post("/request-password-reset", authController.requestPasswordReset.bind(authController));
router.post("/reset-password", authController.resetPassword.bind(authController));

// Protected routes
router.post("/logout", requireAuth,  authController.logout.bind(authController));
router.post("/invite", requireAuth, authController.inviteUser.bind(authController));
router.post("/send-verification", requireAuth, authController.sendVerificationEmail);
router.get("/verify-email", authController.verifyEmail);

export default router;