import test from "node:test";
import assert from "node:assert/strict";

import {
  Decimal,
  calculateTransactionTotal,
  parseDecimalInput,
  toDatabaseNumeric,
  MAX_QUANTITY,
  MAX_UNIT_PRICE,
  MAX_TOTAL_VALUE,
  TOTAL_VALUE_SCALE,
} from "../src/lib/portfolio/decimal";

import {
  replayLedger,
  type LedgerEntry,
  type LedgerEventType,
} from "../src/lib/portfolio/ledger";

/**
 * Construct a database-shaped ledger event using the correct total-value
 * precision for quantity multiplied by unit price.
 */
function event(
  type: LedgerEventType,
  quantity: string,
  pricePerUnit: string
): LedgerEntry {
  const totalValue = new Decimal(quantity)
    .mul(pricePerUnit)
    .toDecimalPlaces(
      TOTAL_VALUE_SCALE,
      Decimal.ROUND_HALF_UP
    )
    .toFixed(TOTAL_VALUE_SCALE);

  return {
    type,
    quantity,
    pricePerUnit,
    totalValue,
  };
}

test("BUY events accumulate quantity and recorded acquisition cost", () => {
  const position = replayLedger(
    [
      event("buy", "2", "10"),
      event("buy", "1", "16"),
    ],
    "BTC"
  );

  assert.equal(position.quantity.toString(), "3");
  assert.equal(position.totalCost.toString(), "36");
  assert.equal(position.costBasis.toString(), "12");
});

test("SELL events remove cost at weighted average basis", () => {
  const position = replayLedger(
    [
      event("buy", "2", "10"),
      event("buy", "1", "16"),
      event("sell", "1", "20"),
    ],
    "BTC"
  );

  assert.equal(position.quantity.toString(), "2");
  assert.equal(position.totalCost.toString(), "24");
  assert.equal(position.costBasis.toString(), "12");
});

test("ADJUSTMENT resets the position and later trades replay normally", () => {
  const position = replayLedger(
    [
      event("buy", "2", "10"),
      event("adjustment", "5", "4"),
      event("buy", "1", "7"),
      event("sell", "2", "8"),
    ],
    "ETH"
  );

  assert.equal(position.quantity.toString(), "4");
  assert.equal(position.totalCost.toString(), "18");
  assert.equal(position.costBasis.toString(), "4.5");
});

test("zero-quantity ADJUSTMENT closes a position", () => {
  const position = replayLedger(
    [
      event("buy", "2", "10"),
      event("adjustment", "0", "10"),
    ],
    "BTC"
  );

  assert.equal(position.quantity.toString(), "0");
  assert.equal(position.totalCost.toString(), "0");
  assert.equal(position.costBasis.toString(), "0");
});

test("a BUY after zero-quantity adjustment starts a new position", () => {
  const position = replayLedger(
    [
      event("buy", "2", "10"),
      event("adjustment", "0", "10"),
      event("buy", "3", "5"),
    ],
    "BTC"
  );

  assert.equal(position.quantity.toString(), "3");
  assert.equal(position.totalCost.toString(), "15");
  assert.equal(position.costBasis.toString(), "5");
});

test("an oversell is rejected", () => {
  assert.throws(
    () =>
      replayLedger(
        [
          event("buy", "1", "10"),
          event("sell", "1.00000001", "12"),
        ],
        "BTC"
      ),
    /Cannot sell/
  );
});

test("fully selling a position clears quantity and acquisition cost", () => {
  const position = replayLedger(
    [
      event("buy", "3", "17.25"),
      event("sell", "3", "20"),
    ],
    "BTC"
  );

  assert.equal(position.quantity.toString(), "0");
  assert.equal(position.totalCost.toString(), "0");
});

test("recorded totalValue is canonical for acquisition cost", () => {
  const position = replayLedger(
    [
      {
        type: "buy",
        quantity: "0.1",
        pricePerUnit: "0.00000005",
        totalValue: "0.0000000050000000",
      },
    ],
    "BTC"
  );

  assert.equal(position.totalCost.toFixed(16), "0.0000000050000000");
  assert.equal(position.costBasis.toFixed(8), "0.00000005");
});

test("transaction totals preserve all sixteen fractional digits", () => {
  const total = calculateTransactionTotal(
    new Decimal("0.1"),
    new Decimal("0.00000005")
  );

  assert.equal(
    toDatabaseNumeric(
      total,
      "Transaction total",
      MAX_TOTAL_VALUE,
      TOTAL_VALUE_SCALE
    ),
    "0.0000000050000000"
  );
});

test("decimal arithmetic avoids binary floating-point errors", () => {
  const quantity = new Decimal("0.1").plus("0.2");

  assert.equal(quantity.toString(), "0.3");

  const total = calculateTransactionTotal(
    new Decimal("0.1"),
    new Decimal("0.2")
  );

  assert.equal(
    total.toFixed(TOTAL_VALUE_SCALE),
    "0.0200000000000000"
  );
});

test("decimal input accepts valid database-scale values", () => {
  const quantity = parseDecimalInput(
    "1.000000000",
    "Quantity",
    { allowZero: false, maximum: MAX_QUANTITY }
  );

  assert.equal(quantity.toString(), "1");

  const price = parseDecimalInput(
    "125.12345678",
    "Price",
    { allowZero: true, maximum: MAX_UNIT_PRICE }
  );

  assert.equal(price.toFixed(8), "125.12345678");
});

test("decimal input rejects meaningful precision beyond eight places", () => {
  assert.throws(
    () =>
      parseDecimalInput(
        "1.123456789",
        "Quantity",
        { allowZero: false, maximum: MAX_QUANTITY }
      ),
    /up to 8 decimal places/
  );
});

test("decimal input rejects zero for positive-only fields", () => {
  assert.throws(
    () =>
      parseDecimalInput(
        "0",
        "Quantity",
        { allowZero: false, maximum: MAX_QUANTITY }
      ),
    /greater than zero/
  );
});

test("decimal input rejects values beyond the database numeric limit", () => {
  assert.throws(
    () =>
      parseDecimalInput(
        "1000000000000",
        "Price",
        { allowZero: true, maximum: MAX_UNIT_PRICE }
      ),
    /database limit/
  );
});

test("database numeric formatting applies scale eight by default", () => {
  const value = new Decimal("12.345678901");

  assert.equal(
    toDatabaseNumeric(value, "Cost basis", MAX_UNIT_PRICE),
    "12.34567890"
  );
});

test("maximum transaction value fits NUMERIC(48,16)", () => {
  const maximum = new Decimal(MAX_TOTAL_VALUE);

  assert.equal(maximum.decimalPlaces(), TOTAL_VALUE_SCALE);
  assert.equal(maximum.toFixed(TOTAL_VALUE_SCALE), MAX_TOTAL_VALUE);
});
