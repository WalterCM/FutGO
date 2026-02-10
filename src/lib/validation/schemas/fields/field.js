import { z } from 'zod';

/**
 * Field management validation schemas
 */

export const fieldCreateSchema = z.object({
  name: z.string()
    .min(1, "El nombre del campo es requerido")
    .max(100, "El nombre es demasiado largo")
    .trim(),
    
  nickname: z.string()
    .max(50, "El apodo es demasiado largo")
    .trim()
    .optional(),
    
  address: z.string()
    .min(1, "La dirección es requerida")
    .max(200, "La dirección es demasiado larga")
    .trim(),
    
  phone: z.string()
    .regex(/^[+]?[0-9\s\-()]+$/, "Formato de teléfono inválido")
    .max(20, "El teléfono es demasiado largo")
    .optional(),
    
  google_maps_url: z.string()
    .url("URL de Google Maps inválida")
    .refine(url => url.startsWith('https://maps.google.com') || url.startsWith('https://www.google.com/maps'), 
           "La URL debe ser de Google Maps")
    .optional(),
    
  players_per_team: z.number()
    .int("El número de jugadores debe ser un entero")
    .min(1, "Se necesita al menos 1 jugador por equipo")
    .max(11, "Máximo 11 jugadores por equipo"),
    
  price_per_hour: z.number()
    .min(0, "El precio no puede ser negativo")
    .max(1000, "El precio por hora es demasiado alto")
});

export const fieldUpdateSchema = fieldCreateSchema.partial().extend({
  id: z.number().int().positive()
});

export const fieldListSchema = z.array(fieldCreateSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
}));