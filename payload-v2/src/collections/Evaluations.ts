import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

/**
 * Evaluations — RAG quality evaluation results.
 * Aligned with engine-v2/evaluation/ module.
 */
export const Evaluations: CollectionConfig = {
  slug: 'evaluations',
  admin: {
    useAsTitle: 'query',
    defaultColumns: ['query', 'faithfulness', 'relevancy', 'correctness', 'createdAt'],
    group: 'Analytics',
  },
  access: {
    read: isAdmin,
    create: () => true,   // Engine writes eval results
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'query',
      type: 'text',
      required: true,
      admin: { description: 'The question that was evaluated' },
    },
    {
      name: 'answer',
      type: 'textarea',
      admin: { description: 'The generated answer' },
    },
    {
      name: 'referenceAnswer',
      type: 'textarea',
      admin: { description: 'Ground-truth reference answer (if available)' },
    },

    // ── Scores ──
    {
      name: 'faithfulness',
      type: 'number',
      min: 0,
      max: 1,
      admin: { description: 'Is the answer grounded in the retrieved context? (0-1)' },
    },
    {
      name: 'relevancy',
      type: 'number',
      min: 0,
      max: 1,
      admin: { description: 'Is the retrieved context relevant to the query? (0-1)' },
    },
    {
      name: 'correctness',
      type: 'number',
      min: 0,
      max: 1,
      admin: { description: 'Is the answer factually correct? (0-1, requires reference)' },
    },

    // ── Feedback ──
    {
      name: 'feedback',
      type: 'json',
      admin: { description: 'Evaluator feedback per dimension' },
    },

    // ── Meta ──
    {
      name: 'model',
      type: 'text',
      admin: { description: 'LLM model used for the query' },
    },
    {
      name: 'sourceCount',
      type: 'number',
      admin: { description: 'Number of sources retrieved' },
    },
    {
      name: 'batchId',
      type: 'text',
      admin: { description: 'Batch evaluation run ID (for grouping)' },
    },
  ],
}
