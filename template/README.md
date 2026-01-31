# Vantage402 Express Application

Production-ready Express.js application template implementing the x402 payment protocol with enterprise-grade Vantage402 payment verification infrastructure.

## Overview

This application demonstrates payment-gated HTTP endpoints using the [x402 protocol](https://www.x402.org/), which leverages HTTP's `402 Payment Required` status code to enable native cryptocurrency payments through standard HTTP semantics.

[Vantage402](https://vantage402.com) provides the payment verification layer, handling blockchain validation automatically through its facilitator service. This eliminates the need for RPC node management, transaction polling, and specialized blockchain infrastructure.

## Key Capabilities

- **Zero Blockchain Expertise Required** - Complete payment infrastructure without cryptographic knowledge
- **Sub-5-Minute Integration** - Streamlined configuration through environment variables
- **99.99% Uptime SLA** - Geographic redundancy with automatic failover
- **Multi-Chain Native** - Unified support for Base, Solana, and Ethereum networks
- **Real-time Settlement Tracking** - WebSocket notifications for payment events
- **Production Hardened** - Battle-tested middleware with comprehensive error handling

## Prerequisites

Before deployment, ensure you have:

- **Node.js** 18 or later ([nvm](https://github.com/nvm-sh/nvm) installation recommended)
- Wallet address for payment receipt (Ethereum/Base or Solana compatible)
- **Optional**: Coinbase Developer Platform API credentials for Base mainnet operations
  - Obtain at [portal.cdp.coinbase.com/projects](https://portal.cdp.coinbase.com/projects)

## Installation

### Environment Configuration

Create your local environment file:

```bash
cp .env-local .env
```

Configure the required parameters in `.env`:

```env
# Vantage402 payment verification endpoint
FACILITATOR_URL=https://facilitator.vantage402.com

# Target blockchain network
NETWORK=base-sepolia  # Options: base-sepolia, base, solana-devnet, solana

# Payment recipient address
ADDRESS=0xYourWalletAddressHere

# Base mainnet credentials (optional for testnets)
CDP_API_KEY_ID="Your Coinbase Developer Platform Key ID"
CDP_API_KEY_SECRET="Your Coinbase Developer Platform Secret"
```

### Network Selection

| Network | Identifier | Type | Use Case |
|---------|-----------|------|----------|
| Base Sepolia | `base-sepolia` | Testnet | Development and testing environment |
| Base Mainnet | `base` | Mainnet | Production deployment (requires CDP credentials) |
| Solana Devnet | `solana-devnet` | Testnet | Solana development environment |
| Solana Mainnet | `solana` | Mainnet | Solana production deployment |

### Dependency Installation

```bash
npm install
# or
pnpm install
# or
bun install
```

### Development Server

```bash
npm run dev
```

Your payment-gated server will be available at `http://localhost:4021`

### Production Build

```bash
npm run build
npm start
```

## Architecture

### Payment Flow

The x402 protocol implements a deterministic payment verification sequence:

1. **Client Request** - Client requests protected resource at `/weather` without payment
2. **Payment Requirement** - Server returns `402 Payment Required` with payment parameters
3. **Payment Execution** - Client processes payment on target blockchain
4. **Verification Request** - Client retries request with payment proof in `X-PAYMENT` header
5. **Facilitator Validation** - Vantage402 verifies payment proof against blockchain state
6. **Content Delivery** - Server grants access to protected resource with payment confirmation

### Vantage402 Integration

This application leverages Vantage402's payment facilitator at `https://facilitator.vantage402.com`:

**Capabilities:**
- **Instant Verification** - Sub-second payment validation without blockchain RPC polling
- **Multi-Network Support** - Unified verification across Base, Solana, and Ethereum
- **Automatic Validation** - Zero-configuration payment proof verification
- **Settlement Tracking** - Real-time payment status via WebSocket connections

**Infrastructure Benefits:**
- No blockchain node deployment or management
- No RPC endpoint configuration
- No transaction monitoring infrastructure
- No cryptographic key handling

## Testing

### Test Suite Execution

```bash
# Execute full test suite
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The application includes comprehensive test coverage:

- **Unit Tests** - Application initialization, middleware configuration, route handling
- **Integration Tests** - Complete payment flows, multi-endpoint verification, facilitator integration
- **Edge Cases** - Concurrent request handling, malformed payment proofs, network failures

Detailed testing documentation: [`__tests__/README.md`](__tests__/README.md)

## API Endpoints

### Health Check (Unprotected)

```bash
GET /health
```

Returns application health status without payment requirement.

**Response:**
```json
{
  "status": "ok",
  "service": "x402-express-server"
}
```

### Weather Data (Payment Required)

```bash
GET /weather
```

**Payment Requirement:** $0.001 USDC on Base Sepolia testnet

**Initial Request (No Payment):**
```bash
curl http://localhost:4021/weather
```

**Response (402 Payment Required):**
```json
{
  "error": "X-PAYMENT header is required",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "base-sepolia",
    "maxAmountRequired": "1000",
    "resource": "http://localhost:4021/weather",
    "payTo": "0xYourAddress",
    "maxTimeoutSeconds": 60,
    "asset": "0x..."
  }
}
```

**Successful Payment Response:**
```json
{
  "report": {
    "weather": "sunny",
    "temperature": 70
  }
}
```

### Premium Content (Custom Token)

```bash
GET /premium/content
```

**Payment Requirement:** 100000 atomic units of custom token

Demonstrates accepting payments in custom EIP-3009 or SPL tokens with configurable parameters.

## Extension Guide

### Adding Payment-Gated Endpoints

Configure new endpoints in `app.ts`:

```typescript
app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /your-endpoint": {
        price: "$0.10",              // Dollar-denominated pricing
        network: "base-sepolia",
      },
      "POST /api/generate": {
        price: "$1.00",
        network: "base",             // Mainnet deployment
      },
      "/premium/*": {                // Wildcard routes supported
        price: {
          amount: "100000",          // Atomic units
          asset: {
            address: "0xabc...",     // Token contract address
            decimals: 18,
            eip712: {
              name: "WETH",
              version: "1",
            },
          },
        },
        network: "base-sepolia",
      },
      "GET /solana-data": {
        price: "0.001 SOL",          // Solana native token
        network: "solana",
      },
    },
    {
      url: facilitatorUrl,           // Vantage402 facilitator endpoint
    },
  ),
);

// Define route handlers
app.get("/your-endpoint", (req, res) => {
  res.json({ message: "Payment verified successfully" });
});
```

### Payment Response Format

Successful payment responses include:

**Response Body:** Application-defined JSON payload
**Response Headers:**
- `X-PAYMENT-RESPONSE` - Encoded payment confirmation from Vantage402

**Example:**
```json
{
  "report": {
    "weather": "sunny",
    "temperature": 70
  }
}
```

## Use Cases

This template is production-ready for:

- **API Monetization** - Usage-based billing for API endpoints
- **Premium Content Delivery** - Paywalled articles, media, or datasets
- **AI/ML Services** - Per-inference pricing for model APIs
- **Data Access** - Monetized analytics or research data
- **Micropayment Infrastructure** - High-volume, low-value transactions
- **SaaS Metering** - Consumption-based pricing models

## Deployment

### Environment Variables

Configure in your deployment platform:

```env
FACILITATOR_URL=https://facilitator.vantage402.com
NETWORK=base
ADDRESS=0xYourProductionWalletAddress
CDP_API_KEY_ID=your_key_id
CDP_API_KEY_SECRET=your_key_secret
PORT=4021  # Optional, defaults to 4021
```

### Production Deployment

The application is optimized for serverless and containerized deployments:

- **Vercel** - Zero-configuration deployment with automatic scaling
- **Docker** - Containerized deployment for Kubernetes or cloud platforms
- **Traditional Hosting** - Node.js 18+ with 512MB RAM minimum

## Resources

- **Vantage402 Platform**: [vantage402.com](https://vantage402.com)
- **Technical Documentation**: [docs.vantage402.com](https://docs.vantage402.com)
- **x402 Protocol Specification**: [x402.org](https://x402.org)
- **Upstream x402 Reference**: [github.com/coinbase/x402](https://github.com/coinbase/x402)
- **Community**: [@vantage402](https://x.com/vantage402)

## Support

- **Documentation**: [docs.vantage402.com](https://docs.vantage402.com)
- **Examples**: [github.com/coinbase/x402/tree/main/examples](https://github.com/coinbase/x402/tree/main/examples)
- **Issues**: [github.com/Vantage402/vantage402-javascript-starter/issues](https://github.com/Vantage402/vantage402-javascript-starter/issues)
- **Email**: support@vantage402.com

---

**Powered by Vantage402** | Enterprise-grade HTTP-native cryptocurrency payment infrastructure
