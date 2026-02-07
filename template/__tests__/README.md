# x402 Express Server Tests

Comprehensive test suite for the x402 Express server with Vantage402 integration.

## Test Structure

### `app.test.ts` - Unit Tests
Tests the core functionality of the Express application:
- Health check endpoint
- Payment middleware integration
- Route configuration
- HTTP methods and headers
- Vantage402 configuration

### `payment-flow.test.ts` - Integration Tests
Tests the complete x402 payment flow with Vantage402:
- Initial 402 Payment Required responses
- Payment requirements validation
- Multi-endpoint payment handling
- Vantage402 facilitator integration
- Error handling and edge cases

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (during development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Coverage

The test suite covers:

✅ **Server Configuration**
- App initialization
- Payment middleware setup
- Route definitions

✅ **Payment Flow**
- 402 Payment Required responses
- Payment requirements structure
- Multi-chain support (Base, Solana, Ethereum)
- Vantage402 facilitator integration

✅ **API Endpoints**
- Health check (unprotected)
- `/weather` - Dollar-based pricing
- `/premium/*` - Custom token pricing

✅ **Error Handling**
- Invalid payment proofs
- Malformed requests
- Non-existent routes

✅ **Edge Cases**
- Concurrent requests
- Empty payment headers
- Different HTTP methods

## Testing with Vantage402

These tests verify integration with Vantage402's payment infrastructure:

### Payment Requirements
Tests ensure all required fields for Vantage402 verification are present:
- `scheme` - Payment scheme (e.g., "exact")
- `network` - Blockchain network (e.g., "base-sepolia")
- `payTo` - Recipient wallet address
- `maxAmountRequired` - Payment amount in atomic units
- `resource` - API endpoint URL
- `maxTimeoutSeconds` - Payment timeout
- `asset` - Token contract address

### Multi-Chain Support
Tests verify support for Vantage402's multi-chain capabilities:
- Base (mainnet and testnet)
- Solana (mainnet and devnet)
- Ethereum
- Custom ERC-20/SPL tokens

### Payment Verification Flow
While full end-to-end tests require actual blockchain transactions, these tests verify:
1. ✅ Initial request returns 402 with payment requirements
2. ✅ Payment requirements contain correct Vantage402 parameters
3. ✅ Different endpoints have different payment requirements
4. ✅ Payment middleware is properly configured

## Writing New Tests

### Adding Endpoint Tests

```typescript
describe("New Endpoint", () => {
  it("should require payment", async () => {
    const response = await request(app).get("/your-endpoint");

    expect(response.status).toBe(402);
    expect(response.body.paymentRequirements).toBeDefined();
  });
});
```

### Testing Custom Payment Configurations

```typescript
it("should accept custom payment configuration", () => {
  const testApp = createApp({
    facilitatorUrl: "https://test-facilitator.example.com" as any,
    payTo: "0xYourAddress",
  });

  expect(testApp).toBeDefined();
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

## Test Dependencies

- **vitest** - Fast unit test framework
- **supertest** - HTTP assertion library
- **@vitest/coverage-v8** - Code coverage reporting

## Troubleshooting

### Tests failing with "Cannot find module"
Make sure you've installed dependencies:
```bash
npm install
```

### Coverage reports not generating
Install coverage dependencies:
```bash
npm install --save-dev @vitest/coverage-v8
```

### Tests timing out
Increase timeout in `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  },
});
```

## Learn More

- **Vantage402 Docs**: [docs.vantage402.com](https://docs.vantage402.com)
- **x402 Protocol**: [x402.org](https://x402.org)
- **Vitest Documentation**: [vitest.dev](https://vitest.dev)
- **Supertest Guide**: [github.com/ladjs/supertest](https://github.com/ladjs/supertest)

---

**Powered by Vantage402** - Making cryptocurrency payments simple for developers.
