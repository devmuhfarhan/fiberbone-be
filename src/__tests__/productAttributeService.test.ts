import * as productAttributeService from '../services/productAttributeService';
import * as categoryModel from '../models/productCategoryModel';
import * as unitModel from '../models/productUnitModel';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../models/productCategoryModel');
jest.mock('../models/productUnitModel');

describe('Product Attribute Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Category', () => {
    describe('getCategories', () => {
      it('should return categories', async () => {
        const mockCategories = [{ id: '1', name: 'Cat 1' }];
        (categoryModel.findAllByOutlet as any).mockResolvedValue(mockCategories);

        const result = await productAttributeService.getCategories('outlet1');
        expect(categoryModel.findAllByOutlet).toHaveBeenCalledWith('outlet1', '');
        expect(result).toEqual(mockCategories);
      });
    });

    describe('createCategory', () => {
      it('should create category', async () => {
        const mockCat = { id: '1', outlet_id: 'outlet1', name: 'Cat 1' };
        (categoryModel.create as any).mockResolvedValue(mockCat);

        const result = await productAttributeService.createCategory('outlet1', 'Cat 1');
        expect(categoryModel.create).toHaveBeenCalledWith({ outlet_id: 'outlet1', name: 'Cat 1' });
        expect(result).toEqual(mockCat);
      });

      it('should throw error if name is empty', async () => {
        await expect(productAttributeService.createCategory('outlet1', ' ')).rejects.toThrow('Category name is required');
      });
    });

    describe('updateCategory', () => {
      it('should update category', async () => {
        const mockCat = { id: '1', name: 'Cat 2' };
        (categoryModel.update as any).mockResolvedValue(mockCat);

        const result = await productAttributeService.updateCategory('1', 'outlet1', 'Cat 2');
        expect(categoryModel.update).toHaveBeenCalledWith('1', 'outlet1', 'Cat 2');
        expect(result).toEqual(mockCat);
      });

      it('should throw error if name is empty on update', async () => {
        await expect(productAttributeService.updateCategory('1', 'outlet1', '')).rejects.toThrow('Category name is required');
      });

      it('should throw error if category not found', async () => {
        (categoryModel.update as any).mockResolvedValue(null);
        await expect(productAttributeService.updateCategory('1', 'outlet1', 'Cat 2')).rejects.toThrow('Category not found');
      });
    });

    describe('deleteCategory', () => {
      it('should delete category', async () => {
        (categoryModel.remove as any).mockResolvedValue(true);

        const result = await productAttributeService.deleteCategory('1', 'outlet1');
        expect(categoryModel.remove).toHaveBeenCalledWith('1', 'outlet1');
        expect(result).toBe(true);
      });

      it('should throw error if category not found on delete', async () => {
        (categoryModel.remove as any).mockResolvedValue(false);
        await expect(productAttributeService.deleteCategory('1', 'outlet1')).rejects.toThrow('Category not found');
      });
    });
  });

  describe('Unit', () => {
    describe('getUnits', () => {
      it('should return units', async () => {
        const mockUnits = [{ id: '1', name: 'Unit 1' }];
        (unitModel.findAllByOutlet as any).mockResolvedValue(mockUnits);

        const result = await productAttributeService.getUnits('outlet1');
        expect(unitModel.findAllByOutlet).toHaveBeenCalledWith('outlet1', '');
        expect(result).toEqual(mockUnits);
      });
    });

    describe('createUnit', () => {
      it('should create unit', async () => {
        const mockUnit = { id: '1', outlet_id: 'outlet1', name: 'Unit 1' };
        (unitModel.create as any).mockResolvedValue(mockUnit);

        const result = await productAttributeService.createUnit('outlet1', { name: 'Unit 1' });
        expect(unitModel.create).toHaveBeenCalledWith({ outlet_id: 'outlet1', name: 'Unit 1', abbreviation: undefined });
        expect(result).toEqual(mockUnit);
      });

      it('should throw error if unit name is empty', async () => {
        await expect(productAttributeService.createUnit('outlet1', { name: ' ' })).rejects.toThrow('Unit name is required');
      });
    });

    describe('updateUnit', () => {
      it('should update unit', async () => {
        const mockUnit = { id: '1', name: 'Unit 2' };
        (unitModel.update as any).mockResolvedValue(mockUnit);

        const result = await productAttributeService.updateUnit('1', 'outlet1', { name: 'Unit 2' });
        expect(unitModel.update).toHaveBeenCalledWith('1', 'outlet1', { name: 'Unit 2' });
        expect(result).toEqual(mockUnit);
      });

      it('should throw error if unit not found', async () => {
        (unitModel.update as any).mockResolvedValue(null);
        await expect(productAttributeService.updateUnit('1', 'outlet1', { name: 'Unit 2' })).rejects.toThrow('Unit not found');
      });
    });

    describe('deleteUnit', () => {
      it('should delete unit', async () => {
        (unitModel.remove as any).mockResolvedValue(true);

        const result = await productAttributeService.deleteUnit('1', 'outlet1');
        expect(unitModel.remove).toHaveBeenCalledWith('1', 'outlet1');
        expect(result).toBe(true);
      });

      it('should throw error if unit not found on delete', async () => {
        (unitModel.remove as any).mockResolvedValue(false);
        await expect(productAttributeService.deleteUnit('1', 'outlet1')).rejects.toThrow('Unit not found');
      });
    });
  });
});
