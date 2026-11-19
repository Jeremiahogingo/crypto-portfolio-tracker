# Product Capabilities and Limitations

## 1. Current application areas

The production build currently contains routes for:

- Dashboard (`/`)
- Portfolio (`/portfolio`)
- Analytics (`/analytics`)
- Markets (`/markets`)
- News (`/news`)
- Alerts (`/alerts`)
- Watchlist (`/watchlist`)
- Settings (`/settings`)
- Onboarding (`/onboarding`)
- Login and signup (`/login`, `/signup`)
- Public market API routes under `/api/crypto/`

The exact UI and route implementation in `src/app/` is authoritative.

## 2. Portfolio capabilities

The data model supports profiles, portfolios, holdings, and a transaction/event
ledger. The current server-action flow resolves a user's default portfolio for
several operations. The schema can represent multiple portfolios; verify the
UI/action selection flow before describing full multi-portfolio switching as a
user-facing capability.

The ledger supports BUY, SELL, and ADJUSTMENT. A holding is a derived current
position. A manual correction is kept as an adjustment event; zero quantity
closes the projection but retains history.

## 3. Market and news information

The market API adapter uses CoinGecko for markets, global statistics, and
trending information. The route layer uses cache revalidation and fallback
payloads. News is aggregated from RSS/Atom publishers and normalized into a
common article format. Partial feed failures are tolerated; fallback news is
used when all feeds fail.

These are cached market/news views, not exchange execution or guaranteed
real-time tick feeds.

## 4. Analytics semantics

Current position valuation uses current holding quantity, market price, and
cost basis. Net cash invested is derived from BUY value less SELL proceeds.
ADJUSTMENT changes the recorded position but is excluded from cash-flow
analytics and monthly buy/sell activity.

A transaction ledger by itself is not a complete historical account-value
series. Historical daily portfolio valuation requires timestamped price and
position snapshots or an equivalent historical data source. Do not market a
chart as historical portfolio value unless its data pipeline actually stores
and uses those snapshots.

The current accounting rule is weighted-average cost. It is not a tax-lot
engine and does not calculate FIFO/specific-identification tax obligations.

## 5. Alerts and future notification delivery

The database stores user-owned alert configurations with a direction,
threshold, and enabled flag. Do not assume alert evaluation, scheduled polling,
email delivery, or push delivery is active solely because an alert row exists.
Document and test the relevant worker/provider if it is added or deployed.

## 6. Explicit non-goals

The project is not documented as:

- A custodial wallet or key vault.
- A broker or exchange.
- An automated trading/execution engine.
- A tax-preparation/tax-lot accounting product.
- A guaranteed real-time market data terminal.

Exchange synchronization, CSV import/export, tax reports, snapshots, additional
providers, and notification workers should be treated as future work unless
present in the current source and deployment.
