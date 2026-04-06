import type { Access } from 'payload'

/**
 * isOwnerOrAdmin — Access control for user-owned documents.
 *
 * Requires the collection to have a `user` relationship field
 * pointing to the `users` collection. Admins can read all;
 * other users can only read documents they own.
 */
export const isOwnerOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { user: { equals: user.id } }
}
