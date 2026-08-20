/**
 * InduCore Production API Test Suite
 *
 * Tests all 4+ product categories with multi-field updates.
 * Run AFTER deploying to Vercel and configuring Upstash Redis.
 *
 * Usage:
 *   npx tsx server/scripts/test_production.ts [base_url]
 *
 * Example:
 *   npx tsx server/scripts/test_production.ts https://inducore-website.vercel.app
 *   npx tsx server/scripts/test_production.ts http://localhost:5000
 */

const BASE_URL = process.argv[2] || "https://inducore-website.vercel.app";

// ── Helpers ────────────────────────────────────────────────────────────────

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface TestResult {
  name: string;
  pass: boolean;
  note: string;
}

const results: TestResult[] = [];
let totalPass = 0;
let totalFail = 0;

function ok(name: string, note = "") {
  results.push({ name, pass: true, note });
  totalPass++;
  console.log(`  ✅ ${name}${note ? " — " + note : ""}`);
}

function fail(name: string, note = "") {
  results.push({ name, pass: false, note });
  totalFail++;
  console.error(`  ❌ ${name}${note ? " — " + note : ""}`);
}

async function get(path: string): Promise<{ status: number; body: JsonValue }> {
  const r = await fetch(`${BASE_URL}${path}`, {
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function post(path: string, payload: unknown): Promise<{ status: number; body: JsonValue }> {
  const r = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

function section(title: string) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`);
}

// ── Test cases ─────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🧪 InduCore Production API Tests`);
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Time:   ${new Date().toISOString()}\n`);

  // ── 1. Health ───────────────────────────────────────────────────────────
  section("1. Health Check");
  {
    const { status, body } = await get("/api/integration/health");
    const b = body as Record<string, JsonValue>;
    if (status === 200 && b?.status === "ok") {
      ok("GET /api/integration/health", `storage=${b.storage}, products=${b.totalProducts}`);
    } else if (status === 503 && b?.status === "degraded") {
      fail("GET /api/integration/health", `Storage not configured: ${b?.message}`);
      console.error("\n⛔ STOP: Configure Upstash Redis before running further tests.\n");
      process.exit(1);
    } else {
      fail("GET /api/integration/health", `HTTP ${status}: ${JSON.stringify(b)}`);
    }
  }

  // ── 2. Get all products ─────────────────────────────────────────────────
  section("2. GET /api/products — all products");
  let allProducts: Record<string, JsonValue>[] = [];
  {
    const { status, body } = await get("/api/products");
    if (status === 200 && Array.isArray(body) && body.length > 0) {
      allProducts = body as Record<string, JsonValue>[];
      ok("GET /api/products", `returned ${allProducts.length} products`);

      // Check categories present
      const cats = [...new Set(allProducts.map((p) => p.category as string))].sort();
      if (cats.length >= 4) {
        ok("Product catalog has ≥ 4 categories", cats.join(", "));
      } else {
        fail("Product catalog has ≥ 4 categories", `only found: ${cats.join(", ")}`);
      }
    } else {
      fail("GET /api/products", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── 3. GET single products from 4 different categories ─────────────────
  section("3. GET single product — 4 categories");
  const testProducts: Array<{ id: string; category: string }> = [
    { id: "GB-100", category: "Gearboxes" },
    { id: "M-100",  category: "Motors" },
    { id: "P-100",  category: "Pumps" },
    { id: "V-100",  category: "Valves" },
  ];
  const foundProducts: Record<string, Record<string, JsonValue>> = {};
  for (const tp of testProducts) {
    const { status, body } = await get(`/api/products/${tp.id}`);
    const b = body as Record<string, JsonValue>;
    if (status === 200 && b?.id === tp.id) {
      ok(`GET /api/products/${tp.id}`, `category=${b.category}, version=${b.version}`);
      foundProducts[tp.id] = b;
    } else {
      fail(`GET /api/products/${tp.id}`, `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── 4. Verify product records in Redis ──────────────────────────────
  section("4. Verify product records in Redis");
  const gb100 = foundProducts["GB-100"];
  if (gb100) {
    const specs = gb100.specifications as Record<string, string>;
    const version = gb100.version as number;
    ok("GB-100 loaded from Redis", `version=${version}, Gear Ratio=${specs?.["Gear Ratio"]}`);
  }

  // ── 5. POST — Gearbox update (GB-100 dynamic toggle 10:1 <-> 12:1) ────────
  section("5. POST — Gearbox update (GB-100)");
  const gb100Specs = (gb100?.specifications as Record<string, string>) || {};
  const currentRatio = gb100Specs["Gear Ratio"] || "10:1";
  const targetRatio = currentRatio === "10:1" ? "12:1" : "10:1";
  const gb100Version = (gb100?.version as number) ?? 1;
  const gb100RequestId = `test-gb100-${Date.now()}`;
  let gb100NewVersion = gb100Version + 1;
  {
    const { status, body } = await post("/api/integration/product-update", {
      requestId: gb100RequestId,
      productId: "GB-100",
      expectedVersion: gb100Version,
      newVersion: gb100NewVersion,
      updates: { ratio: targetRatio },
      source: { documentName: "gearbox_spec_2026.pdf", documentVersion: "2.0" },
      approval: {
        approved: true,
        approvedBy: "test@inducore.com",
        approvalId: "TEST-APP-001",
      },
    });
    const b = body as Record<string, JsonValue>;
    if (status === 200 && b?.success === true) {
      ok("POST GB-100 ratio update", `v${b.previousVersion} → v${b.newVersion}, changed: ${JSON.stringify(b.changedFields)}`);
      gb100NewVersion = b.newVersion as number;
    } else {
      fail("POST GB-100 ratio update", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── 6. GET — Verify GB-100 ratio persisted ────────────────────────────────────
  section("6. GET — Verify GB-100 ratio persisted");
  {
    const { status, body } = await get("/api/products/GB-100");
    const b = body as Record<string, JsonValue>;
    const specs = b?.specifications as Record<string, string>;
    if (status === 200 && specs?.["Gear Ratio"] === targetRatio) {
      ok(`GB-100 Gear Ratio persisted as ${targetRatio}`, `version=${b.version}`);
    } else {
      fail(`GB-100 Gear Ratio persisted as ${targetRatio}`, `actual=${specs?.["Gear Ratio"]}, HTTP ${status}`);
    }
    if (b?.version === gb100NewVersion) {
      ok(`GB-100 version = ${gb100NewVersion}`, `version=${b.version}`);
    } else {
      fail(`GB-100 version = ${gb100NewVersion}`, `actual=${b?.version}`);
    }
  }

  // ── 7. POST — Motor multi-field update (M-100) ──────────────────────────
  section("7. POST — Motor multi-field update (M-100)");
  const m100 = foundProducts["M-100"];
  const m100Specs = (m100?.specifications as Record<string, string>) || {};
  const currentPower = m100Specs["Power"] || "5.5 kW";
  const targetPower = currentPower === "5.5 kW" ? "7.5 kW" : "5.5 kW";
  const currentSpeed = m100Specs["Speed"] || "1440 RPM";
  const targetSpeed = currentSpeed === "1440 RPM" ? "1460 RPM" : "1440 RPM";
  const m100Version = (m100?.version as number) ?? 1;
  const m100RequestId = `test-m100-${Date.now()}`;
  {
    const { status, body } = await post("/api/integration/product-update", {
      requestId: m100RequestId,
      productId: "M-100",
      expectedVersion: m100Version,
      updates: {
        power: targetPower,
        speed: targetSpeed,
        efficiency: "91.5%",
      },
      source: { documentName: "motor_spec_2026.pdf", documentVersion: "3.1" },
      approval: {
        approved: true,
        approvedBy: "test@inducore.com",
        approvalId: "TEST-APP-002",
      },
    });
    const b = body as Record<string, JsonValue>;
    const changed = b?.changedFields as string[];
    if (status === 200 && b?.success === true && changed?.length >= 2) {
      ok("POST M-100 multi-field update", `v${b.previousVersion} → v${b.newVersion}, changed: ${changed.join(", ")}`);
    } else {
      fail("POST M-100 multi-field update", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── 8. POST — Pump multi-field update (P-100) ───────────────────────────
  section("8. POST — Pump multi-field update (P-100)");
  const p100 = foundProducts["P-100"];
  const p100Version = (p100?.version as number) ?? 1;
  const p100RequestId = `test-p100-${Date.now()}`;
  {
    const { status, body } = await post("/api/integration/product-update", {
      requestId: p100RequestId,
      productId: "P-100",
      expectedVersion: p100Version,
      updates: {
        flowRate: "380 L/min",
        head: "48 m",
      },
      approval: {
        approved: true,
        approvedBy: "test@inducore.com",
        approvalId: "TEST-APP-003",
      },
    });
    const b = body as Record<string, JsonValue>;
    if (status === 200 && b?.success === true) {
      ok("POST P-100 pump update", `v${b.previousVersion} → v${b.newVersion}, changed: ${JSON.stringify(b.changedFields)}`);
    } else {
      fail("POST P-100 pump update", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── 9. POST — Valve update (V-100) ──────────────────────────────────────
  section("9. POST — Valve update (V-100)");
  const v100 = foundProducts["V-100"];
  const v100Version = (v100?.version as number) ?? 1;
  const v100RequestId = `test-v100-${Date.now()}`;
  {
    const { status, body } = await post("/api/integration/product-update", {
      requestId: v100RequestId,
      productId: "V-100",
      expectedVersion: v100Version,
      updates: {
        material: "Stainless Steel 316L",
        pressure: "28 bar",
      },
      approval: {
        approved: true,
        approvedBy: "test@inducore.com",
        approvalId: "TEST-APP-004",
      },
    });
    const b = body as Record<string, JsonValue>;
    if (status === 200 && b?.success === true) {
      ok("POST V-100 valve update", `v${b.previousVersion} → v${b.newVersion}, changed: ${JSON.stringify(b.changedFields)}`);
    } else {
      fail("POST V-100 valve update", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── 10. Version conflict protection ─────────────────────────────────────
  section("10. Version conflict protection");
  {
    const { status, body } = await post("/api/integration/product-update", {
      requestId: `test-conflict-${Date.now()}`,
      productId: "GB-100",
      expectedVersion: 1,  // stale — GB-100 is now at v2
      updates: { ratio: "5:1" },
      approval: { approved: true, approvedBy: "test@inducore.com", approvalId: "TEST-APP-005" },
    });
    const b = body as Record<string, JsonValue>;
    if (status === 409 && b?.status === "version_conflict") {
      ok("Version conflict returns 409", `currentVersion=${b.currentVersion}`);
    } else {
      fail("Version conflict returns 409", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── 11. Approval required ────────────────────────────────────────────────
  section("11. Missing approval returns 403");
  {
    const { status, body } = await post("/api/integration/product-update", {
      requestId: `test-noapproval-${Date.now()}`,
      productId: "GB-100",
      updates: { ratio: "15:1" },
      approval: { approved: false },
    });
    const b = body as Record<string, JsonValue>;
    if (status === 403 && b?.status === "approval_required") {
      ok("Missing approval returns 403");
    } else {
      fail("Missing approval returns 403", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── 12. Supplier fields rejected ─────────────────────────────────────────
  section("12. Supplier-only fields rejected");
  {
    const { status, body } = await post("/api/integration/product-update", {
      requestId: `test-supplier-${Date.now()}`,
      productId: "GB-100",
      updates: { unitPrice: "450.00", stockQty: "150" },
      approval: { approved: true, approvedBy: "test@inducore.com", approvalId: "TEST-APP-006" },
    });
    const b = body as Record<string, JsonValue>;
    if (status === 400 && b?.status === "supplier_fields_rejected") {
      ok("Supplier fields rejected with 400", `rejected: ${JSON.stringify(b.rejectedFields)}`);
    } else {
      fail("Supplier fields rejected with 400", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── 13. Idempotency ──────────────────────────────────────────────────────
  section("13. Idempotency — duplicate requestId returns cached response");
  {
    const { status, body } = await post("/api/integration/product-update", {
      requestId: gb100RequestId,  // same ID as test 5
      productId: "GB-100",
      updates: { ratio: "99:1" },  // different payload — must be ignored
      approval: { approved: true, approvedBy: "test@inducore.com", approvalId: "TEST-APP-DUPE" },
    });
    const b = body as Record<string, JsonValue>;
    if (status === 200 && b?.success === true) {
      ok("Duplicate requestId returns cached 200", `requestId=${gb100RequestId}`);
    } else {
      fail("Duplicate requestId returns cached 200", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
    // Confirm ratio is still targetRatio (not 99:1)
    const { body: verifyBody } = await get("/api/products/GB-100");
    const vb = verifyBody as Record<string, JsonValue>;
    const specs = vb?.specifications as Record<string, string>;
    if (specs?.["Gear Ratio"] === targetRatio) {
      ok(`Idempotency preserved GB-100 ratio as ${targetRatio} (not 99:1)`);
    } else {
      fail(`Idempotency preserved GB-100 ratio as ${targetRatio}`, `actual=${specs?.["Gear Ratio"]}`);
    }
  }

  // ── 14. GET change history ────────────────────────────────────────────────
  section("14. GET /api/products/GB-100/history");
  {
    const { status, body } = await get("/api/products/GB-100/history");
    const b = body as Record<string, JsonValue>;
    const history = b?.history as unknown[];
    if (status === 200 && Array.isArray(history) && history.length >= 1) {
      ok("GB-100 history returned", `${history.length} entry/entries`);
    } else {
      fail("GB-100 history returned", `HTTP ${status}: ${JSON.stringify(body)}`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(65)}`);
  console.log(`  RESULTS: ${totalPass} passed, ${totalFail} failed (${results.length} total)`);
  console.log(`${"═".repeat(65)}\n`);

  if (totalFail > 0) {
    console.log("Failed tests:");
    results.filter((r) => !r.pass).forEach((r) => {
      console.error(`  ❌ ${r.name}: ${r.note}`);
    });
    console.log();
    process.exit(1);
  } else {
    console.log("🎉 All tests passed!\n");
    console.log("Next step: Open the browser and verify the customer page:");
    console.log(`  ${BASE_URL}/#products/GB-100`);
    console.log("  Expected: Gear Ratio = 12:1, Version = 2 (or current version after test)\n");
  }
}

run().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
