import { Router } from "express";
import * as hotelController from "./hotel.controller";
import { authenticateJWT, verifyRole } from "../../middlewares/auth.middleware.js";
import { validateId } from "../../core/middlewares/validateHelper";

const router = Router();

router.use(authenticateJWT);

router.get("/available", hotelController.getAvailableHotels);
router.get("/all", verifyRole(['AURA_ROOT', 'AURA_SUPPORT']), hotelController.getAllHotelsAdmin);
router.post("/", verifyRole(['AURA_ROOT']), hotelController.createHotel);
router.put("/:id", validateId, hotelController.updateHotel);
router.delete("/:id", validateId, verifyRole(['AURA_ROOT']), hotelController.deleteHotel);

export default router;
