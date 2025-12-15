import { eq, inArray } from 'drizzle-orm';
import {DEFAULT_SYSTEM_SETTINGS} from "../constants/default-settings";
import {systemSettings} from "../db/schema";
import db from "../db";

// Cache cục bộ đơn giản (trong production nên dùng Redis)
let settingsCache: Record<string, string> = {};
let lastFetch = 0;
const CACHE_TTL = 60 * 1000; // 1 phút

export class SystemSettingsService {


    async seedDefaults() {
        for (const setting of DEFAULT_SYSTEM_SETTINGS) {
            await db.insert(systemSettings)
                .values(setting)
                .onConflictDoNothing({ target: systemSettings.key }); // Bỏ qua nếu đã tồn tại
        }
    }


    async getAllSettings() {
        const records = await db.select().from(systemSettings);
        // Group lại theo nhóm để trả về FE
        const grouped = records.reduce((acc, curr) => {
            const group = curr.group || 'OTHER';
            if (!acc[group]) acc[group] = [];
            acc[group].push(curr);
            return acc;
        }, {} as Record<string, typeof records>);

        return grouped;
    }

    async getSettingsByGroup(group: string) {
        const records = await db.select().from(systemSettings).where(eq(systemSettings.group, group));
        return records;
    }


    async updateSettings(updates: Array<{ key: string; value: string }>) {
        await db.transaction(async (tx) => {
            for (const update of updates) {
                await tx.update(systemSettings)
                    .set({
                        value: String(update.value), // Luôn convert về string khi lưu
                        updatedAt: new Date()
                    })
                    .where(eq(systemSettings.key, update.key));
            }
        });

        // Invalidate cache
        this.refreshCache();
        return true;
    }


    async get(key: string): Promise<string> {
        // Check cache
        if (Date.now() - lastFetch > CACHE_TTL || !settingsCache[key]) {
            await this.refreshCache();
        }
        return settingsCache[key];
    }

    async getNumber(key: string, fallback = 0): Promise<number> {
        const val = await this.get(key);
        const parsed = parseFloat(val);
        return isNaN(parsed) ? fallback : parsed;
    }

    async getBool(key: string, fallback = false): Promise<boolean> {
        const val = await this.get(key);
        if (!val) return fallback;
        return val.toLowerCase() === 'true' || val === '1';
    }

    async getJson<T>(key: string, fallback: T): Promise<T> {
        const val = await this.get(key);
        try {
            return JSON.parse(val);
        } catch {
            return fallback;
        }
    }

    private async refreshCache() {
        const all = await db.select().from(systemSettings);
        settingsCache = all.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);
        lastFetch = Date.now();
    }
}