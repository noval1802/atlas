import assert from "node:assert/strict";
import test from "node:test";
import { authorize } from "../src/auth/authorize";
import { mapClaimsToKodamScope } from "../src/auth/group-mapping";
import type { AuthPrincipal } from "../src/auth/authorize";

const operator: AuthPrincipal = {
  id: "operator-xii",
  role: "OPERATOR_KODAM",
  name: "Operator XII",
  kodamScope: ["KODAM-XII"],
};

test("scope legacy Kodam XII dipetakan ke kode resmi", () => {
  assert.deepEqual(mapClaimsToKodamScope({ kodam: "KODAM-XII" }), ["XII/TPR"]);
});

test("operator Kodam dapat membaca scope sendiri", () => {
  assert.deepEqual(authorize(operator, "incident:read", "XII/TPR"), { ok: true });
});

test("operator Kodam ditolak untuk scope lain", () => {
  const result = authorize(operator, "incident:read", "III/SLW");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 403);
});

test("pimpinan tidak dapat membuat BANGSIT", () => {
  const result = authorize({ ...operator, role: "PIMPINAN", kodamScope: [] }, "bangsit:create");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 403);
});

test("hanya administrator yang dapat menambah Kotamaops", () => {
  const denied = authorize(operator, "kodam:create");
  assert.equal(denied.ok, false);
  const allowed = authorize({ ...operator, role: "ADMIN", kodamScope: [] }, "kodam:create");
  assert.equal(allowed.ok, true);
});

test("hanya administrator yang dapat menghapus Kotamaops", () => {
  const denied = authorize(operator, "kodam:delete");
  assert.equal(denied.ok, false);
  const allowed = authorize({ ...operator, role: "ADMIN", kodamScope: [] }, "kodam:delete");
  assert.equal(allowed.ok, true);
});
