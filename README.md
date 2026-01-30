# Vantage402 JavaScript Starter

Enterprise-grade Express.js starter for building payment-gated HTTP APIs using the x402 protocol. Deploy production-ready cryptocurrency payment infrastructure in minutes, powered by [Vantage402](https://vantage402.com).

## Overview

[x402](https://www.x402.org/) is an open payment protocol that leverages HTTP's `402 Payment Required` status code to enable native cryptocurrency payments through standard HTTP semantics. This starter provides a battle-tested foundation for building payment-gated applications with institutional-grade reliability.

Vantage402 serves as the payment verification layer, abstracting blockchain complexity while maintaining strict protocol compliance. The result: production-grade payment infrastructure without specialized cryptographic expertise.

## Key Features

This starter template is architected for rapid deployment and exceptional developer experience:

- **Rapid Deployment** - Production server operational in under 5 minutes with minimal configuration
- **Type-Safe Development** - Comprehensive TypeScript support with full type definitions
- **Drop-in Middleware** - Express.js middleware for route-level payment enforcement
- **Multi-Chain Native** - Native support for Base, Solana, and Ethereum networks
- **Flexible Pricing** - Dollar-denominated pricing or custom token configurations
- **Managed Verification** - Vantage402 facilitator handles payment validation with 99.99% uptime SLA
- **Comprehensive Testing** - Production-ready test suite with unit and integration coverage
- **Enterprise Ready** - Environment configuration, error handling, and monitoring included

## Quick Start

### Prerequisites

- **Node.js** 18+ (installation via [nvm](https://github.com/nvm-sh/nvm) recommended)
- Wallet address for receiving payments (Ethereum/Base or Solana compatible)
- **Optional**: Coinbase Developer Platform credentials for Base mainnet ([obtain here](https://portal.cdp.coinbase.com/projects))

### Installation

Bootstrap a new project using `npx`:

```bash
# npm
npx @vantage402/x402-sdk create my-payment-api

# pnpm
pnpm dlx @vantage402/x402-sdk create my-payment-api

# bun
bunx @vantage402/x402-sdk create my-payment-api
```

### Configuration

Create your environment configuration:

```bash
cp .env-local .env
```

Update `.env` with your wallet address:

```env
# Vantage402 payment verification endpoint
FACILITATOR_URL=https://facilitator.vantage402.com

# Target blockchain network
NETWORK=base-sepolia  # Options: base-sepolia, base, solana-devnet, solana

# Payment recipient address
ADDRESS=0xYourWalletAddressHere

# Base mainnet only (optional for testnets)
CDP_API_KEY_ID=your_coinbase_platform_key_id
CDP_API_KEY_SECRET=your_coinbase_platform_secret
```

### Development Server

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4021)
npm run dev

# Run test suite
npm test

# Build for production
npm run build
```

## Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript execution environment |
| **Framework** | Express.js | HTTP server and routing |
| **Language** | TypeScript 5.7+ | Type safety and developer experience |
| **Payment Protocol** | x402 | HTTP-native cryptocurrency payments |
| **Verification Layer** | Vantage402 Facilitator | Blockchain payment validation |
| **Testing** | Vitest + Supertest | Unit and integration testing |

### Project Structure

```
vantage402-javascript-starter/
├── template/                    # Application template
│   ├── app.ts                  # Express application factory
│   ├── index.ts                # Server entry point
│   ├── .env-local              # Environment template
│   └── __tests__/              # Test suites
│       ├── app.test.ts         # Unit tests
│       ├── payment-flow.test.ts # Integration tests
│       └── README.md           # Testing documentation
├── bin/
│   └── create.js               # Project scaffolding CLI
├── scripts/
│   └── sanitize.sh             # Build tooling
├── TESTING.md                  # Comprehensive testing guide
├── package.json                # Package configuration
└── README.md                   # This file
```

### Payment Flow Architecture

The x402 protocol implements a deterministic payment verification sequence:

1. **Initial Request** - Client requests protected resource without payment credentials
2. **Payment Requirement** - Server responds with `402 Payment Required` and payment parameters
3. **Payment Execution** - Client executes blockchain transaction
4. **Verification** - Vantage402 facilitator validates payment proof against blockchain state
5. **Content Delivery** - Server grants access to protected resource with payment confirmation

```typescript
// Example: Payment-gated endpoint
app.get("/api/data", (req, res) => {
  // Middleware validates payment automatically
  // This code executes only after successful payment verification
  res.json({ data: "Premium content" });
});
```

## Implementation Guide

### Server Configuration

The starter includes a pre-configured Express application with payment middleware:

```typescript
import express from "express";
import { paymentMiddleware } from "x402-express";

const app = express();

// Configure route-level payment requirements
app.use(
  paymentMiddleware(
    process.env.ADDRESS, // Payment recipient
    {
      "GET /weather": {
        price: "$0.001",              // Dollar-denominated pricing
        network: "base-sepolia",      // Target network
      },
      "POST /api/generate": {
        price: {
          amount: "1000000",          // Atomic units
          asset: {
            address: "0x...",         // Token contract
            decimals: 6,
            eip712: {
              name: "USDC",
              version: "1"
            },
          },
        },
        network: "base",
      },
    },
    {
      url: process.env.FACILITATOR_URL, // Vantage402 verification
    }
  )
);
```

### Network Configuration

| Network | Identifier | Type | Use Case |
|---------|-----------|------|----------|
| Base Sepolia | `base-sepolia` | Testnet | Development and testing |
| Base Mainnet | `base` | Mainnet | Production deployment (requires CDP credentials) |
| Solana Devnet | `solana-devnet` | Testnet | Solana development environment |
| Solana Mainnet | `solana` | Mainnet | Solana production deployment |

### Payment Requirements Format

Payment requirements follow the x402 specification:

```typescript
interface PaymentRequirements {
  scheme: string;              // Payment scheme identifier
  network: string;             // Blockchain network
  payTo: string;              // Recipient address
  maxAmountRequired: string;  // Payment amount (atomic units)
  resource: string;           // Protected resource URL
  maxTimeoutSeconds: number;  // Payment timeout window
  asset: string;              // Token contract address
}
```

## Testing

### Running Tests

```bash
# Execute full test suite
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The starter includes comprehensive test coverage:

- **Unit Tests** - Express application configuration, middleware integration, route handling
- **Integration Tests** - Complete payment flows, multi-endpoint scenarios, error conditions
- **Edge Cases** - Concurrent requests, malformed payments, network timeouts

See [`TESTING.md`](TESTING.md) for detailed testing documentation.

## Deployment

### Vercel (Recommended)

Optimized for Vercel serverless deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 4021
CMD ["npm", "start"]
```

### Environment Variables

Configure the following in your deployment platform:

```env
FACILITATOR_URL=https://facilitator.vantage402.com
NETWORK=base
ADDRESS=0xYourProductionWalletAddress
CDP_API_KEY_ID=your_key_id
CDP_API_KEY_SECRET=your_key_secret
PORT=4021  # Optional, defaults to 4021
```

## Use Cases

This starter is production-ready for:

- **API Monetization** - Usage-based billing for REST APIs
- **Premium Content Delivery** - Paywalled data, media, or reports
- **AI/ML Inference Services** - Per-request pricing for model inference
- **Data Access** - Monetized datasets and analytics endpoints
- **Micropayment Workflows** - High-volume, low-value transactions
- **SaaS Metering** - Consumption-based pricing models
- **IoT Payment Networks** - Machine-to-machine micropayments

## Vantage402 Integration

### Verification Service

Vantage402's facilitator service provides institutional-grade reliability:

- **Instant Verification** - Sub-second payment validation without RPC polling
- **Multi-Chain Native** - Unified API across Base, Solana, and Ethereum
- **99.99% Uptime SLA** - Geographic redundancy with automatic failover
- **Real-time Settlement** - WebSocket notifications for payment events
- **Zero Infrastructure** - No blockchain nodes or key management required

### API Endpoints

The facilitator exposes a REST API for payment verification:

```
POST https://facilitator.vantage402.com/verify
Content-Type: application/json

{
  "payment_proof": "0x...",
  "network": "base",
  "amount": "1000000",
  "recipient": "0x..."
}
```

See [Vantage402 API Documentation](https://docs.vantage402.com/api-reference/payment-verification) for complete specifications.

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/Vantage402/vantage402-javascript-starter.git
cd vantage402-javascript-starter

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Local Package Linking

```bash
# In this repository
npm link

# In your application
npm link @vantage402/x402-sdk
```

## Contributing

We welcome contributions to improve the Vantage402 JavaScript Starter:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Commit changes with descriptive messages
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

Review our [contribution guidelines](CONTRIBUTING.md) for code standards and review process.

## Resources

- **Vantage402 Platform**: [vantage402.com](https://vantage402.com)
- **Technical Documentation**: [docs.vantage402.com](https://docs.vantage402.com)
- **x402 Protocol Specification**: [x402.org](https://x402.org)
- **Upstream x402 Reference**: [coinbase/x402](https://github.com/coinbase/x402)
- **Community**: [@vantage402](https://x.com/vantage402) | [@x402protocol](https://x.com/x402protocol)

## Support

- **Documentation**: [docs.vantage402.com](https://docs.vantage402.com)
- **GitHub Issues**: [Vantage402/vantage402-javascript-starter/issues](https://github.com/Vantage402/vantage402-javascript-starter/issues)
- **Email**: support@vantage402.com
- **Twitter/X**: [@vantage402](https://x.com/vantage402)

## License

Apache-2.0. Portions derived from [coinbase/x402](https://github.com/coinbase/x402). See [LICENSE](LICENSE) for details.

---

**Built with x402 protocol** | Enterprise-grade HTTP-native cryptocurrency payments
