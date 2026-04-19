import { Request } from 'express';
import { InferSelectModel } from 'drizzle-orm';
import { usersSistema } from './auth.model';

export type UserSistemaTable = InferSelectModel<typeof usersSistema>;

// Este usuario es el que la base de datos nos trae con sus relaciones mapeadas
export interface UserSistema extends UserSistemaTable {
  hotels?: { id: number; nombre?: string; codigo?: string }[];
}

export interface JwtPayload {
  id: number;
  username: string;
  rol: string;
  hotels?: any[];
  allowedHotels?: number[];
}

export interface AuthUser extends Omit<UserSistema, 'password'> {
  hotelId?: number; // Para el contexto de tenant en la transaccion actual
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  file?: any;
}
