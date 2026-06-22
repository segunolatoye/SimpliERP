-- Materialized view for fast stock balance lookups without scanning the full ledger

CREATE MATERIALIZED VIEW stock_balances AS
SELECT
    org_id,
    location_id,
    item_id,
    variant_id,
    SUM(qty_delta) AS current_qty,
    MAX(created_at) AS last_movement_at
FROM
    stock_ledger
GROUP BY
    org_id, location_id, item_id, variant_id;

-- Create unique index to allow CONCURRENTLY refreshing
CREATE UNIQUE INDEX idx_stock_balances_unique 
ON stock_balances(org_id, location_id, item_id, variant_id);

-- Create a function and trigger to refresh the view asynchronously
-- Or use a scheduled pg_cron job:
-- SELECT cron.schedule('*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY stock_balances;');
