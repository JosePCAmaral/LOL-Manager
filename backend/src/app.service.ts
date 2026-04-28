import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class AppService {
  getRoot() {
    return {
      message: 'LOL Manager backend is running',
      endpoints: ['/api/health', '/api/db/health'],
    };
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth() {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST ?? 'mysql',
        port: Number(process.env.DB_PORT ?? '3306'),
        user: process.env.DB_USER ?? 'lolmanager',
        password: process.env.DB_PASSWORD ?? 'lolmanager',
        database: process.env.DB_NAME ?? 'lol_manager',
      });

      const [rows] = await connection.query('SELECT 1 AS ok');
      await connection.end();

      return {
        status: 'ok',
        database: 'mysql',
        result: Array.isArray(rows) && rows.length > 0 ? rows[0] : { ok: 1 },
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'mysql',
        message: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}