import { z } from 'zod';

/**
 * Authentication and profile validation schemas
 */

export const profileUpdateSchema = z.object({
  full_name: z.string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre es demasiado largo")
    .trim()
    .regex(/^[a-zA-ZÀ-ž\s]+$/, "El nombre contiene caracteres inválidos"),
  
  nickname: z.string()
    .max(20, "El apodo es demasiado largo")
    .regex(/^[a-zA-Z0-9À-ž\s_-]+$/, "El apodo contiene caracteres inválidos")
    .optional(),
    
  phone: z.string()
    .regex(/^[+]?[\d\s\-\(\)]+$/, "Formato de teléfono inválido")
    .max(20, "El teléfono es demasiado largo")
    .optional()
});

export const profileSetupSchema = z.object({
  full_name: z.string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre es demasiado largo")
    .trim()
    .regex(/^[a-zA-ZÀ-ž\s]+$/, "El nombre contiene caracteres inválidos"),
    
  nickname: z.string()
    .min(1, "El apodo es requerido")
    .max(20, "El apodo es demasiado largo")
    .regex(/^[a-zA-Z0-9À-ž\s_-]+$/, "El apodo contiene caracteres inválidos"),
    
  phone: z.string()
    .regex(/^[+]?[\d\s\-\(\)]+$/, "Formato de teléfono inválido")
    .max(20, "El teléfono es demasiado largo")
    .optional()
});

export const userRoleUpdateSchema = z.object({
  role: z.enum(['admin', 'user']),
  is_active: z.boolean().optional()
});