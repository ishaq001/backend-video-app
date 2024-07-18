import { Router } from "express";
import {
	loginUser,
	logoutUser,
	refreshAcessToken,
	registerUser,
	changeCurrentPassword,
	getCurrentUser,
	updateAccountDetails,
	updateUserAvatar,
	updateUserCoverImg,
	getUserChannelProfile,
	getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
	upload.fields([
		{
			name: "avatar",
			maxCount: 1,
		},
		{
			name: "coverImage",
			maxCount: 1,
		},
	]),
	registerUser
);
router.route("/login").post(loginUser);

// SECURED_ROUTES

// POST ROUTES
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAcessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").post(verifyJWT, getCurrentUser);

// PATCH ROUTES
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
	.route("/avatar")
	.patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
	.route("/coverImage")
	.patch(verifyJWT, upload.single("coverImage"), updateUserCoverImg);
router

	// GET ROUTES
	.route("/user-channel-profile/:username")
	.get(verifyJWT, getUserChannelProfile);
router.route("/watchHistory").get(verifyJWT, getWatchHistory);

export default router;
