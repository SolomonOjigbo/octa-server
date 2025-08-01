import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { add } from "date-fns";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  tenantId: string;
  storeId?: string;
  warehouseId?: string;
  jti:       string;
}

export function signJwt(payload: Omit<JwtPayload, 'jti'>): string  {
  const jti = uuidv4();
  return jwt.sign(
    {
      ...payload,
      jti, 
      iss: 'octa-app',
      aud: ['octa-app'],
    },
    JWT_SECRET,
    { 
       expiresIn: parseInt(JWT_EXPIRES_IN) || '60m', // Convert to number if possible
      algorithm: 'HS256',
    }
  );
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return uuidv4();
}

export function getJwtExpiry(token: string): Date | null {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded.payload === 'string') return null;
  
  const exp = decoded.payload.exp;
  return exp ? new Date(exp * 1000) : null;
}