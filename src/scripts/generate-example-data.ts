import { exampleDataService } from '../service/example-data'
import { prisma } from '../db'

async function main() {
  console.log('Starting example data generation...')
  try {
    await exampleDataService.export()
    console.log('Example data generation completed successfully.')
  } catch (error) {
    console.error('Error generating example data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
