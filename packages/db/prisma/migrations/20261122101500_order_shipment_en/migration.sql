-- English display names for historical order lines and shipment events.
ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "productNameEn" TEXT;

ALTER TABLE "ShipmentEvent"
  ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT,
  ADD COLUMN IF NOT EXISTS "locationEn" TEXT;
