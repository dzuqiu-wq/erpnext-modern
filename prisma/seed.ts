import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL!

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('admin', 10)

  await prisma.user.upsert({
    where: { email: 'admin@erpnext.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@erpnext.com',
      password: hashedPassword,
      role: 'System Manager',
    },
  })

  console.log('Database seeded successfully: admin@erpnext.com / admin')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
