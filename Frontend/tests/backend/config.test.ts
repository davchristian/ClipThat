import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { isSupabaseUrl, supabaseConfigError } from "../../src/lib/supabase-config";
import { ConfigError, publicConfig } from "../../src/server/config";
import { failure } from "../../src/server/http";

test("Supabase configuration accepts project and local URLs and rejects invalid values", () => {
  for (const url of [
    "https://project.supabase.co",
    "http://127.0.0.1:54321",
    " https://project.supabase.co ",
  ])
    assert.equal(isSupabaseUrl(url), true);
  for (const url of [
    undefined,
    "",
    "project",
    "project.supabase.co",
    "https://",
    "ftp://project.supabase.co",
    "https://user:password@project.supabase.co",
  ])
    assert.equal(isSupabaseUrl(url), false);
  assert.equal(supabaseConfigError("https://project.supabase.co", "test-key"), "");
  assert.match(supabaseConfigError("invalid", "test-key"), /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(supabaseConfigError("https://project.supabase.co", "  "), /PUBLISHABLE_KEY/);
});

test("invalid Supabase URL yields a safe configuration error instead of an SDK exception", async () => {
  const beforeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const beforeKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "private-test-value";
    let error: unknown;
    try {
      publicConfig();
    } catch (e) {
      error = e;
    }
    assert.ok(error instanceof ConfigError);
    const response = failure(error);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error.code, "not_configured");
    assert.match(body.error.message, /Project URL/);
    assert.ok(!body.error.message.includes("private-test-value"));
    process.env.NEXT_PUBLIC_SUPABASE_URL = " https://project.supabase.co ";
    assert.deepEqual(publicConfig(), {
      url: "https://project.supabase.co",
      key: "private-test-value",
    });
  } finally {
    if (beforeUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = beforeUrl;
    if (beforeKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = beforeKey;
  }
});

test("live proxy with invalid Supabase URL allows auth pages and redirects protected pages", async () => {
  const names = [
    "NEXT_PUBLIC_APP_MODE",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    process.env.NEXT_PUBLIC_APP_MODE = "live";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
    const { proxy } = await import("../../src/proxy");
    for (const path of ["/login", "/register"])
      assert.equal((await proxy(new NextRequest(`http://localhost:3000${path}`))).status, 200);
    const response = await proxy(new NextRequest("http://localhost:3000/classes"));
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://localhost:3000/login");
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});
