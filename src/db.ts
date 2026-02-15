import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from './generated/prisma/client'

const adapter = new PrismaLibSql({ url: 'file:./data/data.db' })

export const prisma = new PrismaClient({ adapter })
