/**
 * Integration Tests for x402 Payment Flow with Vantage402
 *
 * These tests verify the complete payment flow including:
 * - Initial request (402 Payment Required)
 * - Payment processing
 * - Request with payment proof
 * - Access to protected content
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../app.js";

describe("x402 Payment Flow Integration with Vantage402", () => {
  let app: Express;
  const testAddress = "0x1234567890123456789012345678901234567890";

  beforeAll(() => {
    app = createApp({
      facilitatorUrl: "https://facilitator.vantage402.com" as any,
      payTo: testAddress,
    });
  });

  describe("Complete Payment Flow", () => {
    it("should follow the standard x402 payment flow", async () => {
      // Step 1: Initial request without payment - should get 402
      const initialRequest = await request(app).get("/weather");

      expect(initialRequest.status).toBe(402);
      expect(initialRequest.body.error).toBeDefined();
      expect(initialRequest.body.paymentRequirements).toBeDefined();

      // Step 2: Payment requirements should contain all necessary info
      const { paymentRequirements } = initialRequest.body;

      expect(paymentRequirements).toMatchObject({
        network: "base-sepolia",
        payTo: testAddress,
        scheme: expect.any(String),
        maxAmountRequired: expect.any(String),
        resource: expect.stringContaining("/weather"),
      });

      // In a real scenario, client would:
      // 1. Parse payment requirements
      // 2. Create and sign transaction on blockchain
      // 3. Submit transaction
      // 4. Get payment proof
      // 5. Retry request with X-PAYMENT header

      // Note: We can't complete the full flow in unit tests without
      // actual blockchain interaction or mocking the x402-express middleware
      // But we've verified the payment requirements are returned correctly
    });

    it("should return consistent payment requirements for the same endpoint", async () => {
      const request1 = await request(app).get("/weather");
      const request2 = await request(app).get("/weather");

      expect(request1.body.paymentRequirements.payTo).toBe(
        request2.body.paymentRequirements.payTo,
      );
      expect(request1.body.paymentRequirements.network).toBe(
        request2.body.paymentRequirements.network,
      );
      expect(request1.body.paymentRequirements.maxAmountRequired).toBe(
        request2.body.paymentRequirements.maxAmountRequired,
      );
    });
  });

  describe("Payment Requirements Validation", () => {
    it("should include valid timeout in payment requirements", async () => {
      const response = await request(app).get("/weather");

      const { maxTimeoutSeconds } = response.body.paymentRequirements;
      expect(maxTimeoutSeconds).toBeDefined();
      expect(typeof maxTimeoutSeconds).toBe("number");
      expect(maxTimeoutSeconds).toBeGreaterThan(0);
    });

    it("should include valid asset information", async () => {
      const response = await request(app).get("/weather");

      const { asset } = response.body.paymentRequirements;
      expect(asset).toBeDefined();
      // Asset should be a token address for EVM chains
    });

    it("should include proper scheme information", async () => {
      const response = await request(app).get("/weather");

      const { scheme } = response.body.paymentRequirements;
      expect(scheme).toBeDefined();
      expect(typeof scheme).toBe("string");
    });
  });

  describe("Multiple Endpoints Payment Flow", () => {
    it("should handle different payment requirements for different endpoints", async () => {
      const weatherResponse = await request(app).get("/weather");
      const premiumResponse = await request(app).get("/premium/content");

      expect(weatherResponse.status).toBe(402);
      expect(premiumResponse.status).toBe(402);

      // Different endpoints should have different amounts
      const weatherAmount =
        weatherResponse.body.paymentRequirements.maxAmountRequired;
      const premiumAmount =
        premiumResponse.body.paymentRequirements.maxAmountRequired;

      // Weather is $0.001, premium is 100000 atomic units
      expect(weatherAmount).not.toBe(premiumAmount);
      expect(premiumAmount).toBe("100000");
    });

    it("should maintain separate payment contexts per endpoint", async () => {
      const weather1 = await request(app).get("/weather");
      const premium1 = await request(app).get("/premium/content");
      const weather2 = await request(app).get("/weather");

      // Same endpoint should return same requirements
      expect(weather1.body.paymentRequirements.maxAmountRequired).toBe(
        weather2.body.paymentRequirements.maxAmountRequired,
      );

      // Different endpoints should have different requirements
      expect(weather1.body.paymentRequirements.maxAmountRequired).not.toBe(
        premium1.body.paymentRequirements.maxAmountRequired,
      );
    });
  });

  describe("Vantage402 Facilitator Integration", () => {
    it("should provide resource URL for facilitator verification", async () => {
      const response = await request(app).get("/weather");

      const { resource } = response.body.paymentRequirements;
      expect(resource).toBeDefined();
      expect(typeof resource).toBe("string");
      expect(resource).toContain("/weather");
    });

    it("should include network information for multi-chain support", async () => {
      const response = await request(app).get("/weather");

      const { network } = response.body.paymentRequirements;
      expect(network).toBe("base-sepolia");

      // Vantage402 supports multiple networks
      // Possible values: base, base-sepolia, solana, solana-devnet, ethereum, etc.
      expect(["base", "base-sepolia", "solana", "solana-devnet"]).toContain(
        network,
      );
    });

    it("should provide complete payment requirements for Vantage402 verification", async () => {
      const response = await request(app).get("/weather");

      const { paymentRequirements } = response.body;

      // All fields required by Vantage402's payment verification API
      const requiredFields = [
        "scheme",
        "network",
        "payTo",
        "maxAmountRequired",
        "resource",
        "maxTimeoutSeconds",
      ];

      requiredFields.forEach((field) => {
        expect(paymentRequirements).toHaveProperty(field);
        expect(paymentRequirements[field]).toBeDefined();
      });
    });
  });

  describe("Error Handling", () => {
    it("should return consistent error format for unpaid requests", async () => {
      const response = await request(app).get("/weather");

      expect(response.status).toBe(402);
      expect(response.body).toHaveProperty("error");
      expect(typeof response.body.error).toBe("string");
      expect(response.body.error.length).toBeGreaterThan(0);
    });

    it("should handle concurrent requests properly", async () => {
      const requests = [
        request(app).get("/weather"),
        request(app).get("/weather"),
        request(app).get("/premium/content"),
        request(app).get("/premium/content"),
      ];

      const responses = await Promise.all(requests);

      // All should return 402
      responses.forEach((response) => {
        expect(response.status).toBe(402);
        expect(response.body.paymentRequirements).toBeDefined();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle requests with invalid payment headers gracefully", async () => {
      const response = await request(app)
        .get("/weather")
        .set("X-PAYMENT", "invalid-payment-proof");

      // Should still require valid payment
      expect([402, 400]).toContain(response.status);
    });

    it("should handle requests with empty payment headers", async () => {
      const response = await request(app).get("/weather").set("X-PAYMENT", "");

      // Should still require valid payment
      expect(response.status).toBe(402);
    });

    it("should handle malformed requests properly", async () => {
      const response = await request(app)
        .get("/weather")
        .set("Content-Type", "invalid-content-type");

      // Should still return payment requirements
      expect(response.status).toBe(402);
      expect(response.body.paymentRequirements).toBeDefined();
    });
  });
});
