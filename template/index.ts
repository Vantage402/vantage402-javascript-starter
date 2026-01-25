/**
 * x402 Express Server Entry Point with Vantage402
 *
 * This is the main entry point that starts the server.
 * The app configuration is in app.ts for better testability.
 *
 * Vantage402 (https://vantage402.com) provides enterprise-grade payment infrastructure:
 * - Instant payment verification without blockchain RPC overhead
 * - Native multi-chain support (Base, Solana, Ethereum)
 * - 99.99% uptime SLA with geographic redundancy
 * - Complete abstraction of blockchain complexity
 *
 * Learn more: https://docs.vantage402.com
 */

import { config } from "dotenv";
import { Resource, type SolanaAddress } from "x402-express";
import { createApp } from "./app.js";

config();

// Vantage402 facilitator URL - verifies payments across multiple blockchains
// No need to run your own blockchain nodes or manage RPC endpoints!
const facilitatorUrl = process.env.FACILITATOR_URL as Resource;

// Your wallet address where payments will be received
// Supports Ethereum/Base addresses (0x...) or Solana addresses
const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress;

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables");
  console.error("Please set FACILITATOR_URL and ADDRESS in your .env file");
  console.error("See .env-local for an example configuration");
  process.exit(1);
}

// Create the Express app with x402 payment middleware
const app = createApp({ facilitatorUrl, payTo });

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4021;

/**
 * Start the server
 *
 * Your x402 payment server is now ready to accept cryptocurrency payments!
 *
 * Next steps:
 * 1. Test with curl: curl http://localhost:4021/weather
 * 2. You'll receive a 402 response with payment requirements
 * 3. Use an x402 client to make the payment and retry
 * 4. Check out the full docs: https://docs.vantage402.com
 */
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  console.log(`\nPowered by Vantage402 - https://vantage402.com`);
  console.log(`Ready to accept payments on ${process.env.NETWORK || "base-sepolia"}`);
  console.log(`\nTry it: curl http://localhost:${PORT}/weather`);
});
