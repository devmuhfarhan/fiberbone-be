import pool from '../config/db';

export interface Journal {
  id: string;
  outlet_id: string;
  journal_number: string;
  date: Date;
  description: string;
  reference?: string;
  created_at: Date;
  updated_at: Date;
  items?: JournalItem[];
}

export interface JournalItem {
  id: string;
  journal_id: string;
  account_id: string;
  debit: number;
  credit: number;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJournalData {
  outlet_id: string;
  journal_number: string;
  date: string;
  description: string;
  reference?: string;
  items: {
    account_id: string;
    debit: number;
    credit: number;
    description?: string;
  }[];
}

export const findAllByOutletId = async (outletId: string): Promise<Journal[]> => {
  const result = await pool.query(
    'SELECT * FROM journals WHERE outlet_id = $1 ORDER BY date DESC, created_at DESC',
    [outletId]
  );
  return result.rows;
};

export const findByIdAndOutletId = async (id: string, outletId: string): Promise<Journal | null> => {
  const journalResult = await pool.query(
    'SELECT * FROM journals WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  
  if (journalResult.rows.length === 0) return null;
  const journal = journalResult.rows[0] as Journal;

  const itemsResult = await pool.query(
    'SELECT * FROM journal_items WHERE journal_id = $1',
    [id]
  );
  journal.items = itemsResult.rows;

  return journal;
};

export const createJournal = async (data: CreateJournalData, externalClient?: any): Promise<Journal> => {
  const client = externalClient || await pool.connect();
  try {
    if (!externalClient) await client.query('BEGIN');

    // 1. Insert Journal
    const journalResult = await client.query(
      `INSERT INTO journals (outlet_id, journal_number, date, description, reference)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.outlet_id, data.journal_number, data.date, data.description, data.reference]
    );
    const journal = journalResult.rows[0];

    // 2. Insert Items
    const items = [];
    for (const item of data.items) {
      const itemResult = await client.query(
        `INSERT INTO journal_items (journal_id, account_id, debit, credit, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [journal.id, item.account_id, item.debit, item.credit, item.description]
      );
      items.push(itemResult.rows[0]);
    }

    if (!externalClient) await client.query('COMMIT');
    return { ...journal, items };
  } catch (error) {
    if (!externalClient) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (!externalClient) client.release();
  }
};
