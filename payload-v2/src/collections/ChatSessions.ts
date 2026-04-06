/**
 * ChatSessions — Persists chat conversation sessions to Payload CMS.
 *
 * Each session belongs to a user and records which books were selected.
 * Messages are stored in the related ChatMessages collection.
 *
 * Admin group: Chat
 */

import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const ChatSessions: CollectionConfig = {
  slug: 'chat-sessions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'createdAt'],
    group: 'Chat',
  },
  access: {
    // Users can only read their own sessions; admins can read all
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    // Any authenticated user can create
    create: ({ req: { user } }) => !!user,
    // Only the owner or admin can update
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
  },
  hooks: {
    afterChange: [
      ({ doc, operation }) => {
        console.log(`[ChatSessions] ${operation}:`, { id: doc.id, user: doc.user, title: doc.title })
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'bookIds',
      type: 'json',
      label: 'Session Book IDs',
    },
    {
      name: 'bookTitles',
      type: 'json',
      label: 'Human-readable Book Titles',
    },
  ],
}
