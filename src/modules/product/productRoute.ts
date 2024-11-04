import { Router } from "express";
import { productController } from "./productController";
import { authValidate } from "../../middlewares/authMiddlewares";
import express from "express";
const multer = require("multer");
const upload = multer({
  limits: {
    fieldSize: 25 * 1024 * 1024, // Sets the field size limit to 25MB
  },
});
const routes = Router();

routes
  .post("/create", authValidate, productController.create)
  .post("/createCanvas", authValidate, productController.createCanvas)
  .get("/all", productController.getAll)
  .get("/artsFromHome", productController.getArtsFromHome)
  .get("/categories", productController.getCategories)
  .get("/categories/:category", productController.getArtsFromCategory)
  .get("/groupRelation/section/:groupId", productController.getGroupRelation)
  .get("/groupRelation/:artist", productController.getGroupRelationByArtist)
  .get("/productsByGroup/:artist", productController.getProductByGroupWithArtist)
  .get("/allByUser", authValidate, productController.getByUser)
  .post("/payment", productController.session)
  .post("/buyCredits", productController.buyCredits)
  .get("/infoorders/orders", authValidate, productController.getOrders)
  .post(
    "/upload/art",
    authValidate,
    upload.single("art"),
    productController.createGroup
  )
  .get("/gallery", authValidate, productController.getGallery)
  .post("/generateImage", authValidate, productController.generateImage)
  .post(
    "/webhook",
    express.raw({ type: "application/json" }),
    productController.webhook
  )
  // .post(
  //   "/fulfillment-webhookkkkkk",
  //   express.raw({ type: "application/json" }),
  //   productController.fulfillmentWebhook
  // )
  .put("/", authValidate, productController.update)
  .get("/unique/:id", productController.getByIdUnique)
  .delete("/:productId", authValidate, productController.delete)
  .get("/:id", productController.getById)
  .get("/findProductsByFilters/:id",productController.findProductsByFilters);

export const productRoute = routes;
