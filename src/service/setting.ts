import { prisma } from '../db'

export class SettingService {
  async get(key: string): Promise<string | null> {
    const setting = await prisma.setting.findUnique({
      where: { key },
    })
    return setting?.value ?? null
  }

  async set(key: string, value: string): Promise<void> {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  async getAll(): Promise<Record<string, string>> {
    const settingList = await prisma.setting.findMany()
    return settingList.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, string>,
    )
  }

  async delete(key: string): Promise<void> {
    await prisma.setting.delete({
      where: { key },
    })
  }
}

export const settingService = new SettingService()
