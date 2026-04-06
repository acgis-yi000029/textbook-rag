import type { CollectionConfig } from 'payload'
import { afterChangeHook } from '../hooks/books/afterChange'
import { isEditorOrAdmin } from '../access/isEditorOrAdmin'
import { isAdmin } from '../access/isAdmin'
import { isAdminOrApiKey } from '../access/isAdminOrApiKey'
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
    update: isAdminOrApiKey,
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
      name: 'pdfMedia',
      type: 'upload',
      relationTo: 'pdf-uploads',
      admin: { description: 'Uploaded PDF file for MinerU parsing → ingestion pipeline' },
    },
    {
      name: 'category',
      type: 'text',
      required: true,
      defaultValue: 'textbook',
      admin: {
        description: 'Book category (auto-classified by LLM, user-editable). E.g. textbook, ecdev, real_estate, research_paper',
      },
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
    // ── Pipeline stage status (5 stages) ──
    // chunked:    MinerUReader → Document[] (content_list.json parsing)
    // toc:        TOC extraction from PDF bookmarks / headings
    // bm25:       FTS5/BM25 full-text index building
    // embeddings: HuggingFace/Azure embedding generation
    // vector:     ChromaDB vector store ingestion
    {
      name: 'pipeline',
      type: 'group',
      admin: {
        description: 'Processing pipeline stage status (chunked → toc → bm25 → embeddings → vector)',
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
          admin: { readOnly: true, width: '20%' },
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
          admin: { readOnly: true, width: '20%' },
        },
        {
          name: 'bm25',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Done', value: 'done' },
            { label: 'Error', value: 'error' },
          ],
          admin: { readOnly: true, width: '20%' },
        },
        {
          name: 'embeddings',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Done', value: 'done' },
            { label: 'Error', value: 'error' },
          ],
          admin: { readOnly: true, width: '20%' },
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
          admin: { readOnly: true, width: '20%' },
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
