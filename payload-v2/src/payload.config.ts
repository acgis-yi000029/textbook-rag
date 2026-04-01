import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Books } from './collections/Books'
import { Chunks } from './collections/Chunks'
import { Users } from './collections/Users'
import { IngestTasks } from './collections/IngestTasks'
import { Llms } from './collections/Llms'
import { Prompts } from './collections/Prompts'
import { Queries } from './collections/Queries'
import { Questions } from './collections/Questions'
import { Evaluations } from './collections/Evaluations'
import { seedEndpoint } from './collections/endpoints'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Books,
    Chunks,
    IngestTasks,
    Llms,
    Prompts,
    Queries,
    Questions,
    Evaluations,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:../data/payload.db',
    },
  }),
  sharp,
  upload: {
    limits: {
      fileSize: 50_000_000, // 50 MB — for PDFs
    },
  },
  endpoints: [seedEndpoint],
  plugins: [],
})
