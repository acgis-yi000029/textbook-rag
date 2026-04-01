/**
 * collections/endpoints/seed.ts
 * Payload Custom Endpoint: POST /api/seed
 *
 * Seeds default data into Payload collections using Local API.
 * Uses overrideAccess to bypass auth — seed runs during initial setup
 * before any admin user exists.
 *
 * Body (optional): { collections?: string[] }
 *   - If omitted, seeds all collections
 *   - If provided, seeds only the specified slugs
 */

import type { Endpoint, PayloadRequest } from 'payload'

import { seedCollections, type SeedCollection } from '../../seed'

interface SeedResult {
  slug: string
  label: string
  created: number
  updated: number
  skipped: number
  errors: string[]
}

async function seedOne(
  payload: PayloadRequest['payload'],
  col: SeedCollection,
): Promise<SeedResult> {
  const result: SeedResult = {
    slug: col.slug,
    label: col.label,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  for (const item of col.data) {
    try {
      const uniqueValue = item[col.uniqueField] as string

      // Use overrideAccess: true to bypass auth during seed
      const existing = await payload.find({
        collection: col.slug as any,
        where: { [col.uniqueField]: { equals: uniqueValue } },
        limit: 1,
        overrideAccess: true,
      })

      if (existing.docs.length > 0) {
        // For auth collections (users), skip update to avoid overwriting
        // the user's potentially changed password
        if (col.slug === 'users') {
          result.skipped++
          continue
        }
        await payload.update({
          collection: col.slug as any,
          id: existing.docs[0].id,
          data: item as any,
          overrideAccess: true,
        })
        result.updated++
      } else {
        await payload.create({
          collection: col.slug as any,
          data: item as any,
          overrideAccess: true,
        })
        result.created++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.errors.push(`${item[col.uniqueField]}: ${msg}`)
    }
  }

  return result
}

export const seedEndpoint: Endpoint = {
  handler: async (req) => {
    try {
      const { payload } = req

      // Optionally filter which collections to seed
      let targetSlugs: string[] | undefined
      try {
        if (req.json) {
          const body = await req.json()
          if (body?.collections && Array.isArray(body.collections)) {
            targetSlugs = body.collections
          }
        }
      } catch {
        // No body or invalid JSON — seed all
      }

      const collections = targetSlugs
        ? seedCollections.filter((c) => targetSlugs!.includes(c.slug))
        : seedCollections

      const results: SeedResult[] = []
      for (const col of collections) {
        const r = await seedOne(payload, col)
        results.push(r)
      }

      return Response.json({ success: true, results })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return Response.json({ success: false, error: message }, { status: 500 })
    }
  },
  method: 'post',
  path: '/seed',
}
