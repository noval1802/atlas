import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";

test("health check loopback tidak diarahkan ke hostname kanonis", async () => {
  const previousNextAuthUrl = process.env.NEXTAUTH_URL;
  process.env.NEXTAUTH_URL = "https://192.168.1.202";

  try {
    const request = new NextRequest("http://127.0.0.1:3000/api/health", {
      headers: { host: "127.0.0.1:3000" },
    });
    const response = await proxy(request);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
  } finally {
    if (previousNextAuthUrl === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = previousNextAuthUrl;
  }
});

test("route biasa tetap diarahkan ke hostname kanonis", async () => {
  const previousNextAuthUrl = process.env.NEXTAUTH_URL;
  process.env.NEXTAUTH_URL = "https://192.168.1.202";

  try {
    const request = new NextRequest("http://127.0.0.1:3000/dashboard", {
      headers: { host: "127.0.0.1:3000" },
    });
    const response = await proxy(request);

    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "https://192.168.1.202/dashboard");
  } finally {
    if (previousNextAuthUrl === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = previousNextAuthUrl;
  }
});
