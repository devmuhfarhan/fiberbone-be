import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export interface QueryResult<R = any> {
  rows: R[];
  rowCount: number;
  insertId?: number;
}

export const query = async <R = any>(text: string, params?: any[]): Promise<QueryResult<R>> => {
  let mysqlText = text;
  let mysqlParams: any[] = [];
  
  if (params && params.length > 0) {
    mysqlText = text.replace(/\$(\d+)/g, (match, p1) => {
      const idx = parseInt(p1, 10) - 1;
      mysqlParams.push(params[idx]);
      return '?';
    });
  } else {
    mysqlText = text.replace(/\$(\d+)/g, '?');
    mysqlParams = [];
  }

  mysqlText = mysqlText.replace(/\bILIKE\b/g, 'LIKE');

  const [result] = await pool.query(mysqlText, mysqlParams);
  
  if (Array.isArray(result)) {
    return { rows: result as R[], rowCount: result.length };
  } else {
    const res = result as mysql.ResultSetHeader;
    return { 
      rows: [], 
      rowCount: res.affectedRows, 
      insertId: res.insertId 
    };
  }
};

const poolWrapper = {
  query,
  connect: async () => {
    const conn = await pool.getConnection();
    const connQuery = async <R = any>(text: string, params?: any[]): Promise<QueryResult<R>> => {
      let mysqlText = text;
      let mysqlParams: any[] = [];
      if (params && params.length > 0) {
        mysqlText = text.replace(/\$(\d+)/g, (match, p1) => {
          const idx = parseInt(p1, 10) - 1;
          mysqlParams.push(params[idx]);
          return '?';
        });
      }
      mysqlText = mysqlText.replace(/\bILIKE\b/g, 'LIKE');
      const [result] = await conn.query(mysqlText, mysqlParams);
      if (Array.isArray(result)) {
        return { rows: result as R[], rowCount: result.length };
      } else {
        const res = result as mysql.ResultSetHeader;
        return { rows: [], rowCount: res.affectedRows, insertId: res.insertId };
      }
    };
    
    return {
      query: connQuery,
      release: () => conn.release()
    };
  },
  end: () => pool.end()
};

export default poolWrapper;
