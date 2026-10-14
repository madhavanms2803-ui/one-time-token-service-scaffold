import "dotenv/config";
import assert from "node:assert/strict";
import { issueToken, consumeToken } from "./token-service.js";

async function main() {
  const tokenId = await issueToken(
    { userId: 42, purpose: "test" },
    60
  );

  console.log("issued token:", tokenId);

  // All five attempts start concurrently.
  const results = await Promise.all(
    Array.from({ length: 5 }, () => consumeToken(tokenId))
  );

  const winners = results.filter((result) => result.ok).length;
  console.log("winners:", winners);

  assert.equal(winners, 1, "Exactly one consumer must win");
  assert.equal(
    results.filter((result) => !result.ok).length,
    4,
    "The other four consumers must fail"
  );

  const invalid = await consumeToken(tokenId);
  assert.deepEqual(invalid, { ok: false, reason: "invalid" });

  console.log("PASS: token was single-use.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
