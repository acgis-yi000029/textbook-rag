import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

/**
 * Evaluations Collection — RAG quality evaluation results.
 *
 * Slug: evaluations
 * Aligned with engine-v2/evaluation/ module.
 */
export const Evaluations: CollectionConfig = {
  slug: 'evaluations',
  admin: {
    useAsTitle: 'query',
    defaultColumns: [
      'query', 'faithfulness', 'relevancy', 'contextRelevancy',
      'answerRelevancy', 'createdAt',
    ],
    group: 'Analytics',
  },
  access: {
    read: isAdmin,
    create: () => true,   // Engine writes eval results
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    // ── Query reference ──
    {
      name: 'queryRef',
      type: 'relationship',
      relationTo: 'queries',
      admin: { description: 'Link to the original Queries record' },
    },

    // ── Question + answer ──
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

    // ── Scores (5-dimensional) ──
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
    {
      name: 'contextRelevancy',
      type: 'number',
      min: 0,
      max: 1,
      admin: { description: 'Quality of retrieved context for the query (0-1)' },
    },
    {
      name: 'answerRelevancy',
      type: 'number',
      min: 0,
      max: 1,
      admin: { description: 'How relevant is the answer to the query? (0-1)' },
    },

    // ── Question depth ──
    {
      name: 'questionDepth',
      type: 'text',
      admin: { description: 'Cognitive depth label: surface / understanding / synthesis' },
    },
    {
      name: 'questionDepthScore',
      type: 'number',
      min: 0,
      max: 1,
      admin: { description: 'Normalised question depth score (0-1, from 1-5 scale)' },
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

