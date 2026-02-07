import { PrismaClient } from './generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

const adapter = new PrismaLibSql(libsql as any)

export const prisma = new PrismaClient({ adapter })
