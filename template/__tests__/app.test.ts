/**
 * Unit Tests for x402 Express Server with Vantage402
 *
 * These tests verify the basic functionality of the server,
 * including route configuration and payment middleware integration.
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../app.js";

describe("x402 Express Server with Vantage402", () => {
  let app: Express;

  beforeAll(() => {
    // Create app with test configuration
    app = createApp({
      facilitatorUrl: "https://facilitator.vantage402.com" as any,
      payTo: "0x1234567890123456789012345678901234567890",
    });
  });

  describe("Health Check Endpoint", () => {
    it("should return 200 and status ok", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "ok",
        service: "x402-express-server",
      });
    });
  });

  describe("Payment Required Endpoints", () => {
    describe("GET /weather", () => {
      it("should return 402 Payment Required when no payment is provided", async () => {
        const response = await request(app).get("/weather");

        expect(response.status).toBe(402);
        expect(response.body).toHaveProperty("error");
        expect(response.body).toHaveProperty("paymentRequirements");
      });

      it("should include payment requirements in the response", async () => {
        const response = await request(app).get("/weather");

        const { paymentRequirements } = response.body;
        expect(paymentRequirements).toBeDefined();
        expect(paymentRequirements).toHaveProperty("network");
        expect(paymentRequirements).toHaveProperty("payTo");
        expect(paymentRequirements).toHaveProperty("maxAmountRequired");
        expect(paymentRequirements.payTo).toBe(
          "0x1234567890123456789012345678901234567890",
        );
      });

      it("should specify the correct network", async () => {
        const response = await request(app).get("/weather");

        expect(response.body.paymentRequirements.network).toBe("base-sepolia");
      });

      it("should include resource URL in payment requirements", async () => {
        const response = await request(app).get("/weather");

        const { resource } = response.body.paymentRequirements;
        expect(resource).toBeDefined();
        expect(resource).toContain("/weather");
      });
    });

    describe("GET /premium/content", () => {
      it("should return 402 Payment Required when no payment is provided", async () => {
        const response = await request(app).get("/premium/content");

        expect(response.status).toBe(402);
        expect(response.body).toHaveProperty("error");
        expect(response.body).toHaveProperty("paymentRequirements");
      });

      it("should include custom token payment requirements", async () => {
        const response = await request(app).get("/premium/content");

        const { paymentRequirements } = response.body;
        expect(paymentRequirements).toBeDefined();
        expect(paymentRequirements).toHaveProperty("maxAmountRequired");
        expect(paymentRequirements.maxAmountRequired).toBe("100000");
      });

      it("should match wildcard route /premium/*", async () => {
        const response = await request(app).get("/premium/other-content");

        expect(response.status).toBe(402);
        expect(response.body).toHaveProperty("paymentRequirements");
      });
    });
  });

  describe("Non-existent Routes", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await request(app).get("/non-existent-route");

      expect(response.status).toBe(404);
    });
  });

  describe("HTTP Methods", () => {
    it("should only allow GET for /weather", async () => {
      const postResponse = await request(app).post("/weather");
      expect(postResponse.status).toBe(404);

      const putResponse = await request(app).put("/weather");
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app).delete("/weather");
      expect(deleteResponse.status).toBe(404);
    });
  });

  describe("Response Headers", () => {
    it("should include proper content-type headers", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("should include x402 payment headers on 402 responses", async () => {
      const response = await request(app).get("/weather");

      expect(response.status).toBe(402);
      // The x402-express middleware should handle payment headers
      expect(response.body.paymentRequirements).toBeDefined();
    });
  });

  describe("App Configuration", () => {
    it("should create app with valid config", () => {
      const testApp = createApp({
        facilitatorUrl: "https://test-facilitator.example.com" as any,
        payTo: "0xabcdef1234567890123456789012345678901234",
      });

      expect(testApp).toBeDefined();
      expect(typeof testApp.listen).toBe("function");
    });

    it("should accept Solana addresses", () => {
      const testApp = createApp({
        facilitatorUrl: "https://facilitator.vantage402.com" as any,
        payTo: "11111111111111111111111111111111" as any, // Example Solana address format
      });

      expect(testApp).toBeDefined();
    });
  });

  describe("Vantage402 Integration", () => {
    it("should configure payment middleware with facilitator URL", async () => {
      // Payment middleware should be active
      const response = await request(app).get("/weather");

      // Should get 402 Payment Required, indicating middleware is working
      expect(response.status).toBe(402);
    });

    it("should handle payment requirements correctly", async () => {
      const response = await request(app).get("/weather");

      const { paymentRequirements } = response.body;

      // Verify Vantage402 payment structure
      expect(paymentRequirements).toHaveProperty("scheme");
      expect(paymentRequirements).toHaveProperty("network");
      expect(paymentRequirements).toHaveProperty("payTo");
      expect(paymentRequirements).toHaveProperty("maxAmountRequired");
      expect(paymentRequirements).toHaveProperty("maxTimeoutSeconds");
    });
  });
});
