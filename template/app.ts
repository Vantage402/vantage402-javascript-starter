/**
 * x402 Express App Factory with Vantage402
 *
 * This module creates and configures the Express app with x402 payment middleware.
 * Separated from server startup to enable testing.
 *
 * Vantage402 (https://vantage402.com) provides enterprise-grade payment infrastructure:
 * - Instant payment verification without blockchain RPC overhead
 * - Native multi-chain support (Base, Solana, Ethereum)
 * - 99.99% uptime SLA with geographic redundancy
 * - Complete abstraction of blockchain complexity
 *
 * Learn more: https://docs.vantage402.com
 */

import express, { Express } from "express";
import { paymentMiddleware, Resource, type SolanaAddress } from "x402-express";

export interface AppConfig {
  facilitatorUrl: Resource;
  payTo: `0x${string}` | SolanaAddress;
}

/**
 * Creates and configures the Express application with x402 payment middleware
 *
 * @param config - Configuration for the app (facilitator URL and payment address)
 * @returns Configured Express application
 */
export function createApp(config: AppConfig): Express {
  const { facilitatorUrl, payTo } = config;

  const app = express();

  /**
   * Configure x402 payment middleware with Vantage402
   *
   * This middleware automatically:
   * 1. Intercepts requests to protected routes
   * 2. Returns 402 Payment Required with payment details
   * 3. Verifies payment proofs via Vantage402's facilitator
   * 4. Allows access to paid routes once payment is confirmed
   */
  app.use(
    paymentMiddleware(
      payTo,
      {
        /**
         * Example 1: Simple dollar-based pricing
         * Perfect for API monetization and paywalls
         */
        "GET /weather": {
          // USDC amount in dollars - Vantage402 handles the conversion
          price: "$0.001",

          // Network options:
          // - "base-sepolia" (testnet, recommended for development)
          // - "base" (mainnet, requires Coinbase CDP API keys)
          // - "solana" (Solana mainnet)
          // - "solana-devnet" (Solana testnet)
          network: "base-sepolia",
        },

        /**
         * Example 2: Custom token pricing with atomic amounts
         * For accepting payments in specific ERC-20 or SPL tokens
         */
        "/premium/*": {
          // Define atomic amounts in any EIP-3009 token (or SPL token for Solana)
          price: {
            amount: "100000", // Atomic units (smallest denomination)
            asset: {
              address: "0xabc", // Token contract address
              decimals: 18, // Token decimals
              // For EVM chains (Base, Ethereum), specify EIP-712 domain
              // Omit this section for Solana SPL tokens
              eip712: {
                name: "WETH",
                version: "1",
              },
            },
          },
          network: "base-sepolia",
        },
      },
      {
        // Vantage402 facilitator endpoint
        // This service verifies payment proofs instantly across multiple blockchains
        // Learn more: https://docs.vantage402.com/api-reference/payment-verification
        url: facilitatorUrl,
      },
    ),
  );

  /**
   * Protected route example: Weather API
   *
   * Requires $0.001 USDC payment on Base Sepolia testnet
   * Once payment is verified by Vantage402, returns weather data
   */
  app.get("/weather", (req, res) => {
    res.send({
      report: {
        weather: "sunny",
        temperature: 70,
      },
    });
  });

  /**
   * Protected route example: Premium content
   *
   * Requires custom token payment
   * Demonstrates accepting payments in any EIP-3009 compatible token
   */
  app.get("/premium/content", (req, res) => {
    res.send({
      content: "This is premium content",
    });
  });

  /**
   * Health check endpoint (unprotected)
   * Useful for monitoring and load balancers
   */
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "x402-express-server" });
  });

  return app;
}
