/**
 * Validation schemas and utilities for FutGO application
 * Domain-based organization for maintainability
 */

// Authentication schemas
export * from './schemas/auth/profile.js';

// Match-related schemas
export * from './schemas/matches/match.js';

// User management schemas
export * from './schemas/users/user.js';

// Field management schemas
export * from './schemas/fields/field.js';

// Validation utilities
export * from './utils.js';

// Default export with all schemas for easy access
import { profileUpdateSchema, profileSetupSchema, userRoleUpdateSchema } from './schemas/auth/profile.js';
import { matchCreateSchema, matchUpdateSchema, matchResultSchema, enrollmentSchema } from './schemas/matches/match.js';
import { userCreateSchema, userUpdateSchema, userTableSchema } from './schemas/users/user.js';
import { fieldCreateSchema, fieldUpdateSchema, fieldListSchema } from './schemas/fields/field.js';

export const schemas = {
  auth: {
    profileUpdate: profileUpdateSchema,
    profileSetup: profileSetupSchema,
    userRoleUpdate: userRoleUpdateSchema
  },
  matches: {
    create: matchCreateSchema,
    update: matchUpdateSchema,
    result: matchResultSchema,
    enrollment: enrollmentSchema
  },
  users: {
    create: userCreateSchema,
    update: userUpdateSchema,
    table: userTableSchema
  },
  fields: {
    create: fieldCreateSchema,
    update: fieldUpdateSchema,
    list: fieldListSchema
  }
};