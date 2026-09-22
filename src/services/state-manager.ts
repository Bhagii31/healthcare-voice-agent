import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { ConversationTurn, Session } from "../types";
import { config } from "../utils/config";

export class StateManager {
  private db: Database.Database;

  constructor(dbPath: string = config.dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        condition_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS turns (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
    `);
  }

  createSession(conditionId: string): Session {
    const id = `sess-${randomUUID().slice(0, 8)}`;
    const createdAt = new Date().toISOString();
    this.db
      .prepare("INSERT INTO sessions (id, condition_id, created_at) VALUES (?, ?, ?)")
      .run(id, conditionId, createdAt);
    return { id, conditionId, createdAt, turns: [] };
  }

  addTurn(sessionId: string, turn: ConversationTurn): void {
    this.db
      .prepare("INSERT INTO turns (id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)")
      .run(randomUUID(), sessionId, turn.role, turn.content, turn.timestamp);
  }

  getSession(sessionId: string): Session | undefined {
    const row = this.db
      .prepare("SELECT id, condition_id as conditionId, created_at as createdAt FROM sessions WHERE id = ?")
      .get(sessionId) as { id: string; conditionId: string; createdAt: string } | undefined;
    if (!row) return undefined;

    const turns = this.db
      .prepare("SELECT role, content, timestamp FROM turns WHERE session_id = ? ORDER BY timestamp ASC")
      .all(sessionId) as ConversationTurn[];

    return { ...row, turns };
  }

  listSessions(): { id: string; conditionId: string; createdAt: string }[] {
    return this.db
      .prepare("SELECT id, condition_id as conditionId, created_at as createdAt FROM sessions ORDER BY created_at DESC")
      .all() as { id: string; conditionId: string; createdAt: string }[];
  }

  close(): void {
    this.db.close();
  }
}
