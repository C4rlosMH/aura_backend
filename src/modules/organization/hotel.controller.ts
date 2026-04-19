import { Request, Response, NextFunction } from "express";
import * as hotelService from "./hotel.service";
import { ROLES } from "../../config/constants.js";

// Add typed user to Request inline for simplicity
interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getAvailableHotels = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.AURA_SUPPORT) {
      const hotels = await hotelService.getAllHotels(user);
      return res.json(hotels.map(h => ({ id: h.id, nombre: h.nombre, codigo: h.codigo })));
    }
    if (user.hotels && user.hotels.length > 0) {
        return res.json(user.hotels);
    }
    return res.json([]);
  } catch (error) {
    next(error);
  }
};

export const getAllHotelsAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const hotels = await hotelService.getAllHotels(req.user);
        res.json(hotels);
    } catch (error) { 
        console.error("Error en getAllHotelsAdmin:", error);
        next(error); 
    }
};

export const createHotel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const hotel = await hotelService.createHotel(req.body, req.user);
        res.status(201).json(hotel);
    } catch (error) { next(error); }
};

export const updateHotel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const hotel = await hotelService.updateHotel(String(req.params.id), req.body, req.user);
        res.json(hotel);
    } catch (error) { next(error); }
};

export const deleteHotel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        await hotelService.deleteHotel(String(req.params.id), req.user);
        res.json({ message: "Hotel eliminado correctamente" });
    } catch (error) { next(error); }
};
