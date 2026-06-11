-- Rollback: Remove due_date from sales and purchases
ALTER TABLE sales DROP COLUMN due_date;
ALTER TABLE purchases DROP COLUMN due_date;
