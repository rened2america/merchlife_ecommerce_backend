import { Router } from "express";
import { artistController } from "./artistController";
import { authValidate } from "../../middlewares/authMiddlewares";
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
});
const routes = Router();

routes
  .post(
    "/upload/avatar",
    authValidate,
    upload.single("avatar"),
    artistController.uploadAvatar
  )
  .post(
    "/upload/banner",
    authValidate,
    upload.single("banner"),
    artistController.uploadBanner
  )
  .get("/profile", authValidate, artistController.getProfile)
  .put("/profile", authValidate, artistController.updateProfile)
  .get("/all", artistController.getAll)
  .get("/store/:id", artistController.getProfileAndProducts)
  .get("/verify/:token", artistController.artistConfirm)
  .get("/:token", artistController.tokenConfirm);

export const artistRoute = routes;
