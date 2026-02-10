import { z } from 'zod';

/**
 * Match creation and management validation schemas
 */

export const matchCreateSchema = z.object({
  title: z.string()
    .min(1, "El título es requerido")
    .max(100, "El título es demasiado largo")
    .trim(),
    
  description: z.string()
    .max(500, "La descripción es demasiado larga")
    .trim()
    .optional(),
    
  field_id: z.number()
    .int("El ID del campo debe ser un entero")
    .positive("El ID del campo debe ser positivo"),
    
  max_players: z.number()
    .int("El número de jugadores debe ser un entero")
    .min(2, "Se necesitan al menos 2 jugadores")
    .max(50, "Máximo 50 jugadores permitidos"),
    
  cost: z.number()
    .min(0, "El costo no puede ser negativo")
    .max(1000, "El costo es demasiado alto")
    .optional(),
    
  date: z.string()
    .datetime("Formato de fecha inválido")
    .min(new Date().toISOString(), "La fecha no puede ser en el pasado"),
    
  time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)")
});

export const matchUpdateSchema = matchCreateSchema.partial().extend({
  id: z.number().int().positive()
});

export const matchResultSchema = z.object({
  match_id: z.number().int().positive(),
  team_a_score: z.number().int().min(0),
  team_b_score: z.number().int().min(0),
  team_a_players: z.array(z.number().int().positive()).optional(),
  team_b_players: z.array(z.number().int().positive()).optional(),
  mvp_id: z.number().int().positive().optional(),
  notes: z.string().max(1000).trim().optional()
});

export const enrollmentSchema = z.object({
  match_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  status: z.enum(['enrolled', 'paid', 'cancelled']).optional()
});