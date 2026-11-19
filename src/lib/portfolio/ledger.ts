// src/lib/portfolio/ledger.ts
//
// Pure accounting rules for reconstructing a position from its ledger.
//
// The database's recorded totalValue is the canonical monetary amount for
// each BUY and ADJUSTMENT. SELL proceeds are deliberately not deducted from
// acquisition cost: a sale removes quantity at the current average cost.

import {
  Decimal,
  MAX_QUANTITY,
  type PreciseDecimal,
} from "./decimal";

export type LedgerEventType = "buy" | "sell" | "adjustment";

export interface LedgerEntry {
  type: LedgerEventType;
  quantity: string;
  pricePerUnit: string;
  totalValue: string;
}

export interface LedgerPosition {
  quantity: PreciseDecimal;
  totalCost: PreciseDecimal;
  costBasis: PreciseDecimal;
}

/**
 * Reconstruct a position from chronologically ordered ledger entries.
 *
 * BUY:
 *   Adds the recorded quantity and acquisition value.
 *
 * SELL:
 *   Removes quantity and its proportional share of the average acquisition
 *   cost immediately before the sale.
 *
 * ADJUSTMENT:
 *   Replaces the position quantity and recorded acquisition value.
 *   It preserves all earlier ledger events for historical auditability.
 *
 * The caller must supply deterministic event ordering.
 */
export function replayLedger(
  entries: readonly LedgerEntry[],
  symbol: string
): LedgerPosition {
  let quantity = new Decimal(0);
  let totalCost = new Decimal(0);

  for (const entry of entries) {
    const amount = new Decimal(entry.quantity);
    const price = new Decimal(entry.pricePerUnit);
    const recordedValue = new Decimal(entry.totalValue);

    if (
      !amount.isFinite() ||
      !price.isFinite() ||
      !recordedValue.isFinite() ||
      amount.isNegative() ||
      price.isNegative() ||
      recordedValue.isNegative()
    ) {
      throw new Error(
        "The transaction ledger contains invalid numeric values."
      );
    }

    switch (entry.type) {
      case "buy": {
        if (amount.isZero()) {
          throw new Error("A buy transaction must have a positive quantity.");
        }

        quantity = quantity.plus(amount);
        totalCost = totalCost.plus(recordedValue);

        break;
      }

      case "sell": {
        if (amount.isZero()) {
          throw new Error("A sell transaction must have a positive quantity.");
        }

        if (amount.gt(quantity)) {
          throw new Error(
            `Cannot sell ${amount.toString()} ${symbol} - only ${quantity.toString()} held at that point in the ledger.`
          );
        }

        // Avoid recurring-division residue when the position is closed.
        if (amount.eq(quantity)) {
          quantity = new Decimal(0);
          totalCost = new Decimal(0);
          break;
        }

        const averageCost = totalCost.div(quantity);

        totalCost = totalCost.minus(
          amount.mul(averageCost)
        );

        quantity = quantity.minus(amount);

        break;
      }

      case "adjustment": {
        // An adjustment is an absolute correction, not a trade delta.
        // Zero is intentionally allowed to close the current position.
        quantity = amount;
        totalCost = recordedValue;

        break;
      }

      default: {
        // Invalid event types must never silently disappear from accounting.
        throw new Error(
          `Unsupported transaction type: ${String(entry.type)}`
        );
      }
    }

    if (quantity.gt(new Decimal(MAX_QUANTITY))) {
      throw new Error(
        `${symbol} quantity exceeds the supported database limit.`
      );
    }
  }

  const costBasis = quantity.isZero()
    ? new Decimal(0)
    : totalCost.div(quantity);

  return {
    quantity,
    totalCost,
    costBasis,
  };
}
