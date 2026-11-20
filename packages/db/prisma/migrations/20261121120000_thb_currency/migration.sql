-- Switch the store currency from USD to THB.
ALTER TABLE "Product" ALTER COLUMN "currency" SET DEFAULT 'THB';
ALTER TABLE "Cart" ALTER COLUMN "currency" SET DEFAULT 'THB';
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'THB';
ALTER TABLE "Payment" ALTER COLUMN "currency" SET DEFAULT 'THB';
