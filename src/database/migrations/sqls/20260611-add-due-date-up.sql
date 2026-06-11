-- Migration: Add due_date to sales and purchases tables
ALTER TABLE sales ADD COLUMN due_date DATE NULL AFTER date;
ALTER TABLE purchases ADD COLUMN due_date DATE NULL AFTER date;
