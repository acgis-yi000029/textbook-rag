/**
 * seed/users.ts — Default admin user seed data.
 *
 * Reads credentials from environment variables:
 *   SEED_ADMIN_EMAIL    (default: admin@example.com)
 *   SEED_ADMIN_PASSWORD (default: changeme)
 *
 * The seed endpoint uses Payload Local API which handles password hashing.
 */

export const usersData = [
  {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'changeme',
    role: 'admin',
  },
]
