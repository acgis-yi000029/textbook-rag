import type { CollectionConfig } from 'payload'
import { afterChangeHook } from '../hooks/books/afterChange'
import { isEditorOrAdmin } from '../access/isEditorOrAdmin'
import { isAdmin } from '../access/isAdmin'
import { syncEngineEndpoint } from './endpoints'

export const Books: CollectionConfig = {
  slug: 'books',
  endpoints: [syncEngineEndpoint],
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'authors', 'category', 'subcategory', 'status', 'chunkCount', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: isAdmin,
  },
  // PDF upload is optional — books synced from engine don't have uploads
  // For new books uploaded via admin, use the pdfPath field
  hooks: {
    afterChange: [afterChangeHook],
  },
  fields: [
    {
      name: 'engineBookId',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Maps to engine book_id (e.g. ramalho_fluent_python)' },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'authors',
      type: 'text',
    },
    {
      name: 'isbn',
      type: 'text',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Book cover image (auto-generated or manually uploaded)' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'textbook',
      options: [
        { label: 'Textbook', value: 'textbook' },
        { label: 'EC Dev', value: 'ecdev' },
        { label: 'Real Estate', value: 'real_estate' },
      ],
    },
    {
      name: 'subcategory',
      type: 'text',
      admin: { description: 'Sub-classification within category (e.g. Python, NLP, Policy)' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Indexed', value: 'indexed' },
        { label: 'Error', value: 'error' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'chunkCount',
      type: 'number',
      admin: { readOnly: true },
    },
    // ── Pipeline stage status (v2: 3 stages only) ──
    // chunked: MinerUReader → Document[]
    // toc:     TOC extraction from headings
    // vector:  IngestionPipeline → ChromaDB (includes BM25 in-memory)
    {
      name: 'pipeline',
      type: 'group',
      admin: {
        description: 'Processing pipeline stage status (chunked → toc → vector)',
      },
      fields: [
        {
          name: 'chunked',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Done', value: 'done' },
            { label: 'Error', value: 'error' },
          ],
          admin: { readOnly: true, width: '33%' },
        },
        {
          name: 'toc',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Done', value: 'done' },
            { label: 'Error', value: 'error' },
          ],
          admin: { readOnly: true, width: '33%' },
        },
        {
          name: 'vector',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Done', value: 'done' },
            { label: 'Error', value: 'error' },
          ],
          admin: { readOnly: true, width: '33%' },
        },
      ],
    },
    {
      name: 'metadata',
      type: 'json',
      admin: { condition: (_, siblingData) => siblingData?.status === 'indexed' },
    },
  ],
}
