import fs from "fs";
import path from "path";

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: "admin" | "user";
  createdAt: number;
}

export interface SystemConfig {
  activeBackendUrl: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  updatedAt: number;
}

interface DatabaseSchema {
  users: UserRecord[];
  config: SystemConfig;
}

// In-memory fallback cache
const memoryDb: DatabaseSchema = {
  users: [],
  config: {
    activeBackendUrl: process.env.CONVERTER_BACKEND_URL || "",
    allowRegistration: true,
    maintenanceMode: false,
    updatedAt: Date.now(),
  },
};

const DB_FILE = path.join("/tmp", "soundrip_database.json");

function readDiskDb(): DatabaseSchema | null {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

function writeDiskDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

// Initialize from disk if available
const disk = readDiskDb();
if (disk) {
  memoryDb.users = disk.users || [];
  if (disk.config) {
    memoryDb.config = {
      ...memoryDb.config,
      ...disk.config,
    };
  }
}

export async function getSystemConfig(): Promise<SystemConfig> {
  // Check if persistent KV is configured (Upstash / Vercel KV)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const res = await fetch(`${upstashUrl}/get/soundrip:config`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          const parsed = JSON.parse(data.result);
          memoryDb.config = { ...memoryDb.config, ...parsed };
          return memoryDb.config;
        }
      }
    } catch {
      // Fallback to memory
    }
  }

  // Refresh from disk if available
  const currentDisk = readDiskDb();
  if (currentDisk?.config) {
    memoryDb.config = { ...memoryDb.config, ...currentDisk.config };
  }

  // Fallback to env var if empty
  if (!memoryDb.config.activeBackendUrl && process.env.CONVERTER_BACKEND_URL) {
    memoryDb.config.activeBackendUrl = process.env.CONVERTER_BACKEND_URL;
  }

  return memoryDb.config;
}

export async function updateSystemConfig(
  newConfig: Partial<SystemConfig>
): Promise<SystemConfig> {
  memoryDb.config = {
    ...memoryDb.config,
    ...newConfig,
    updatedAt: Date.now(),
  };

  writeDiskDb(memoryDb);

  // Sync to Upstash / Vercel KV if available
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      await fetch(`${upstashUrl}/set/soundrip:config`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(JSON.stringify(memoryDb.config)),
      });
    } catch {
      // ignore
    }
  }

  return memoryDb.config;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const currentDisk = readDiskDb();
  if (currentDisk?.users && currentDisk.users.length > memoryDb.users.length) {
    memoryDb.users = currentDisk.users;
  }
  return memoryDb.users;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await getAllUsers();
  const normalized = email.toLowerCase().trim();
  return (
    users.find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        u.username.toLowerCase() === normalized
    ) || null
  );
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const users = await getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export async function saveUser(user: UserRecord): Promise<UserRecord> {
  const users = await getAllUsers();
  const existingIdx = users.findIndex((u) => u.id === user.id);
  if (existingIdx >= 0) {
    users[existingIdx] = user;
  } else {
    users.push(user);
  }

  memoryDb.users = users;
  writeDiskDb(memoryDb);
  return user;
}
