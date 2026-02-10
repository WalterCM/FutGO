import { z } from 'zod';

/**
 * User management validation schemas
 */

export const userTableSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email("Email inválido"),
  full_name: z.string().min(1).max(50).optional(),
  nickname: z.string().max(20).optional(),
  phone: z.string()
    .regex(/^[+]?[0-9\s\-()]+$/, "Formato de teléfono inválido")
    .max(20)
    .optional(),
  role: z.enum(['admin', 'user']),
  is_active: z.boolean(),
  elo: z.number().min(0).max(3000).optional(),
  balance: z.number().min(-1000).max(1000).optional(),
  created_at: z.string().datetime(),
  last_login: z.string().datetime().optional()
});

export const userCreateSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre es demasiado largo")
    .trim()
    .regex(/^[a-zA-ZÀ-ž\s]+$/, "El nombre contiene caracteres inválidos"),
  role: z.enum(['admin', 'user']).default('user'),
  phone: z.string()
    .regex(/^[+]?[0-9\s\-()]+$/, "Formato de teléfono inválido")
    .max(20, "El teléfono es demasiado largo")
    .optional()
});

export const userUpdateSchema = z.object({
  full_name: z.string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre es demasiado largo")
    .trim()
    .regex(/^[a-zA-ZÀ-ž\s]+$/, "El nombre contiene caracteres inválidos")
    .optional(),
    
  nickname: z.string()
    .max(20, "El apodo es demasiado largo")
    .regex(/^[a-zA-Z0-9À-ž\s_-]+$/, "El apodo contiene caracteres inválidos")
    .optional(),
    
  phone: z.string()
    .regex(/^[+]?[0-9\s\-()]+$/, "Formato de teléfono inválido")
    .max(20, "El teléfono es demasiado largo")
    .optional(),
    
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.boolean().optional(),
  elo: z.number().min(0).max(3000).optional(),
  balance: z.number().min(-1000).max(1000).optional()
});