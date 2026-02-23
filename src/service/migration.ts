import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { settingService } from './setting'

export class MigrationService {
  async runMigrations() {
    console.log('Checking for pending migrations...')

    const migrationsDir = join(import.meta.dir, 'migrations')
    const files = await readdir(migrationsDir)

    // Sort files alphabetically to ensure order (e.g. 001_..., 002_...)
    const migrationFiles = files
      .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
      .sort()

    for (const file of migrationFiles) {
      const migrationName = file.replace(/\.(ts|js)$/, '')

      // Check if migration has already been run
      const isCompleted = await settingService.get(migrationName)
      if (isCompleted === 'true') {
        // console.log(`Skipping migration: ${migrationName}`)
        continue
      }

      // Special check for backward compatibility for 001_migrateGenericCategory (renamed from 002)
      if (migrationName === '001_migrateGenericCategory') {
         // If the old key exists, we mark this as done too, to prevent double run on existing DBs
         const oldKeyCompleted = await settingService.get('migration_v1_completed')
         if (oldKeyCompleted === 'true') {
            console.log(`Marking ${migrationName} as completed (legacy flag found).`)
            await settingService.set(migrationName, 'true')
            continue
         }
      }

      console.log(`Running migration: ${migrationName}...`)

      try {
        // Dynamic import
        const migrationModule = await import(join(migrationsDir, file))
        if (typeof migrationModule.default !== 'function') {
          console.error(`Migration ${file} does not export a default function.`)
          continue
        }

        await migrationModule.default()

        // Mark as completed
        await settingService.set(migrationName, 'true')
        console.log(`Migration ${migrationName} completed.`)
      } catch (error) {
        console.error(`Migration ${migrationName} failed:`, error)
        // Stop further migrations if one fails
        throw error
      }
    }

    console.log('All migrations checked.')
  }
}

export const migrationService = new MigrationService()
