// src/lib/portfolio/decimal.ts
//
// Shared financial precision utilities.
//
// Database precision:
// - quantities: NUMERIC(28,8)
// - unit prices and holding cost basis: NUMERIC(20,8)
// - transaction values: NUMERIC(48,16)
//
// Multiplying an eight-decimal quantity by an eight-decimal unit price can
// produce sixteen fractional digits. Transaction values therefore use a
// separate scale so that the recorded acquisition cost is not prematurely
// rounded to eight decimal places.

import DecimalJs from "decimal.js";

/**
 * Clone Decimal so this module does not mutate global Decimal configuration.
 * Fifty significant digits provide ample precision for supported operations.
 */
export const Decimal = DecimalJs.clone({
  precision: 50,
  rounding: DecimalJs.ROUND_HALF_UP,
});

export type PreciseDecimal = InstanceType<typeof Decimal>;

export const DATABASE_SCALE = 8;
export const TOTAL_VALUE_SCALE = 16;

export const MAX_QUANTITY =
  "99999999999999999999.99999999";

export const MAX_UNIT_PRICE =
  "999999999999.99999999";

// NUMERIC(48,16): 32 integer digits and 16 fractional digits.
export const MAX_TOTAL_VALUE =
  "99999999999999999999999999999999.9999999999999999";

const DECIMAL_INPUT_PATTERN =
  /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

const MAX_INPUT_LENGTH = 80;

export class DecimalInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecimalInputError";
  }
}

interface DecimalInputOptions {
  allowZero: boolean;
  maximum: string;
}

/**
 * Parse a form value directly from its string representation.
 *
 * Never convert a financial input through JavaScript Number before parsing:
 * doing so can discard precision that Decimal cannot recover.
 *
 * Input precision is capped at eight meaningful decimal places because
 * quantity and unit-price columns both use scale 8.
 */
export function parseDecimalInput(
  rawValue: unknown,
  fieldName: string,
  options: DecimalInputOptions
): PreciseDecimal {
  if (typeof rawValue !== "string") {
    throw new DecimalInputError(`${fieldName} is required.`);
  }

  const normalized = rawValue.trim();

  if (
    normalized.length === 0 ||
    normalized.length > MAX_INPUT_LENGTH ||
    !DECIMAL_INPUT_PATTERN.test(normalized)
  ) {
    throw new DecimalInputError(
      `${fieldName} must be a valid decimal number.`
    );
  }

  let value: PreciseDecimal;

  try {
    value = new Decimal(normalized);
  } catch {
    throw new DecimalInputError(
      `${fieldName} must be a valid decimal number.`
    );
  }

  if (!value.isFinite()) {
    throw new DecimalInputError(
      `${fieldName} must be a finite number.`
    );
  }

  if (value.isNegative()) {
    throw new DecimalInputError(
      `${fieldName} cannot be negative.`
    );
  }

  if (!options.allowZero && value.isZero()) {
    throw new DecimalInputError(
      `${fieldName} must be greater than zero.`
    );
  }

  // Allow harmless trailing zeroes but reject values that would need
  // rounding to fit a NUMERIC(...,8) input column.
  const scaleNormalized = value.toDecimalPlaces(
    DATABASE_SCALE,
    Decimal.ROUND_HALF_UP
  );

  if (!value.eq(scaleNormalized)) {
    throw new DecimalInputError(
      `${fieldName} supports up to ${DATABASE_SCALE} decimal places.`
    );
  }

  if (value.gt(new Decimal(options.maximum))) {
    throw new DecimalInputError(
      `${fieldName} exceeds the supported database limit.`
    );
  }

  return value;
}

/**
 * Convert a calculated Decimal to an explicitly scaled database string.
 *
 * Most columns use scale 8. Transaction total_value uses scale 16 because
 * it stores the product of two scale-8 values.
 */
export function toDatabaseNumeric(
  value: PreciseDecimal,
  fieldName: string,
  maximum: string,
  scale = DATABASE_SCALE
): string {
  if (
    !Number.isInteger(scale) ||
    scale < 0 ||
    scale > TOTAL_VALUE_SCALE
  ) {
    throw new DecimalInputError(
      "The requested database numeric scale is invalid."
    );
  }

  if (!value.isFinite() || value.isNegative()) {
    throw new DecimalInputError(
      `${fieldName} must be a finite, non-negative number.`
    );
  }

  const rounded = value.toDecimalPlaces(
    scale,
    Decimal.ROUND_HALF_UP
  );

  if (rounded.gt(new Decimal(maximum))) {
    throw new DecimalInputError(
      `${fieldName} exceeds the supported database limit.`
    );
  }

  return rounded.toFixed(scale);
}

/**
 * Calculate the recorded transaction value.
 *
 * Both quantity and unit price are scale-8 inputs. Their product is retained
 * at scale 16, avoiding premature rounding of small cryptocurrency values.
 */
export function calculateTransactionTotal(
  quantity: PreciseDecimal,
  pricePerUnit: PreciseDecimal
): PreciseDecimal {
  const total = quantity
    .mul(pricePerUnit)
    .toDecimalPlaces(
      TOTAL_VALUE_SCALE,
      Decimal.ROUND_HALF_UP
    );

  if (total.gt(new Decimal(MAX_TOTAL_VALUE))) {
    throw new DecimalInputError(
      "Transaction total exceeds the supported database limit."
    );
  }

  return total;
}
