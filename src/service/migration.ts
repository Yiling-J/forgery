import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { settingService } from './setting'

interface Migration {
  run: () => Promise<void>
}

export class MigrationService {
  private migrationsDir = join(process.cwd(), 'src/service/migrations')

  async runMigrations() {
    console.log('🔄 Checking for migrations...')

    // Ensure directory exists
    try {
      await readdir(this.migrationsDir)
    } catch {
      console.log('Skipping migrations: No migration directory found')
      return
    }

    const files = await readdir(this.migrationsDir)
    const migrationFiles = files.filter((f) => f.endsWith('.ts')).sort()

    for (const file of migrationFiles) {
      const migrationName = file.replace('.ts', '')
      const settingKey = `migration_executed_${migrationName}`
      const executed = await settingService.get(settingKey)

      if (!executed) {
        console.log(`Running migration: ${migrationName}`)
        try {
          const migrationModule: Migration = await import(join(this.migrationsDir, file))
          if (typeof migrationModule.run === 'function') {
             await migrationModule.run()
             await settingService.set(settingKey, 'true')
             console.log(`✅ Migration completed: ${migrationName}`)
          } else {
             console.warn(`⚠️ Migration ${migrationName} has no run function, skipping.`)
          }
        } catch (error) {
          console.error(`❌ Migration failed: ${migrationName}`, error)
          throw error
        }
      }
    }

    console.log('✨ All migrations up to date.')
  }
}

export const migrationService = new MigrationService()
