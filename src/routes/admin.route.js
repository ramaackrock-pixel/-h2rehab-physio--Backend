import { Router } from 'express'
import { signIn, logout, refreshAccessToken, changePassword, wipeData } from '../controller/admin.controller.js'
import { verifyJWT } from '../middleware/auth.middleware.js'

const router = Router()

router.route("/signin").post(signIn)
router.route("/login").post(signIn) // Supporting both signin and login

// Secured routes
router.route("/logout").post(verifyJWT, logout)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changePassword)
router.route("/wipe-data").delete(verifyJWT, wipeData)

export default router;
