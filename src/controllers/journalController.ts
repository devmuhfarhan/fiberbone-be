import { Request, Response } from 'express';
import * as journalService from '../services/journalService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const getJournals = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const journals = await journalService.getJournals(outletId);
    return res.json(formatSuccess(journals));
  } catch (error: any) {
    logger.error('journalController.getJournals error:', error);
    return res.status(500).json(formatError(error.message || 'Internal Server Error'));
  }
};

export const getJournalById = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const id = req.params.id as string;
    const journal = await journalService.getJournalById(id, outletId);
    return res.json(formatSuccess(journal));
  } catch (error: any) {
    logger.error('journalController.getJournalById error:', error);
    return res.status(404).json(formatError(error.message));
  }
};

export const createJournal = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const { journal_number, date, description, reference, items } = req.body;
    if (!journal_number || !date || !description || !items) {
      return res.status(400).json(formatError('Missing required fields'));
    }

    const journal = await journalService.createJournal({
      outlet_id: outletId,
      journal_number,
      date,
      description,
      reference,
      items
    });
    return res.status(201).json(formatSuccess(journal));
  } catch (error: any) {
    logger.error('journalController.createJournal error:', error);
    return res.status(400).json(formatError(error.message));
  }
};
