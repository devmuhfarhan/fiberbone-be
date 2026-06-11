import * as inventoryModel from '../models/inventoryModel';

interface HistoryServiceParams {
  outletId: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const getOpnameHistory = async (params: HistoryServiceParams) => {
  return inventoryModel.getOpnameHistory(params);
};

export const getMutationHistory = async (params: HistoryServiceParams) => {
  return inventoryModel.getMutationHistory(params);
};

export const getBatchHistory = async (params: HistoryServiceParams) => {
  return inventoryModel.getBatchHistory(params);
};

export const getExchangeHistory = async (params: HistoryServiceParams) => {
  return inventoryModel.getExchangeHistory(params);
};
