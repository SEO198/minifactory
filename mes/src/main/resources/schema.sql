CREATE TABLE IF NOT EXISTS work_orders (
  id BIGSERIAL PRIMARY KEY,
  work_order_no VARCHAR(20) NOT NULL UNIQUE,
  product_type VARCHAR(30) NOT NULL,
  target_qty INT NOT NULL CHECK (target_qty > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'READY'
    CHECK (status IN ('READY','RUNNING','STOPPED','TARGET_REACHED','COMPLETED')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  target_reached_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_events (
  id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL UNIQUE,
  work_order_id BIGINT NOT NULL REFERENCES work_orders(id),
  device_id VARCHAR(30) NOT NULL,
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('PRODUCT_COMPLETED')),
  product_type VARCHAR(30) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  result VARCHAR(10) NOT NULL CHECK (result IN ('GOOD','DEFECT')),
  occurred_at TIMESTAMP NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_work_order ON production_events(work_order_id);

CREATE TABLE IF NOT EXISTS production_results (
  id BIGSERIAL PRIMARY KEY,
  work_order_id BIGINT NOT NULL UNIQUE REFERENCES work_orders(id),
  good_qty INT NOT NULL DEFAULT 0 CHECK (good_qty >= 0),
  defect_qty INT NOT NULL DEFAULT 0 CHECK (defect_qty >= 0),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);