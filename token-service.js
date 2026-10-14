import crypto from "node:crypto";
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);
const keyFor = (id) => `token:${id}`;

export async function issueToken(payload, ttlSeconds) {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new TypeError("ttlSeconds must be a positive integer");
  }

  let tokenId;

  // NX prevents overwriting an existing token if an ID ever collides.
  do {
    tokenId = crypto.randomBytes(16).toString("hex");
  } while (
    (await redis.set(
      keyFor(tokenId),
      JSON.stringify(payload),
      "EX",
      ttlSeconds,
      "NX"
    )) !== "OK"
  );

  return tokenId;
}

export async function consumeToken(tokenId) {
  const value = await redis.getdel(keyFor(tokenId));

  if (value === null) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, payload: JSON.parse(value) };
}
