import { test } from "node:test";
import assert from "node:assert/strict";
import { signupError } from "../../src/server/signup-error";
import { failure } from "../../src/server/http";

test("signup failures distinguish email restrictions, rate limits, and password rules", () => {
  const email = signupError({ code: "email_address_not_authorized", status: 400 });
  assert.equal(email.status, 503);
  assert.match(email.message, /SMTP/);
  for (const code of ["over_email_send_rate_limit", "over_request_rate_limit"])
    assert.equal(signupError({ code, status: 429 }).status, 429);
  assert.equal(signupError({ code: "weak_password", status: 422 }).code, "signup_weak_password");
  assert.equal(
    signupError({ code: "email_address_invalid", status: 422 }).code,
    "signup_invalid_email",
  );
  for (const code of ["signup_disabled", "email_provider_disabled"])
    assert.equal(signupError({ code }).code, "signup_disabled");
  assert.equal(signupError({ code: "captcha_failed", status: 400 }).code, "signup_captcha_failed");
});

test("service and configuration failures do not blame the submitted password", async () => {
  const service = signupError({ code: "unexpected_failure", status: 500 });
  assert.equal(service.status, 503);
  assert.match(service.message, /Auth logs/);
  const response = failure(service);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "signup_service_error");
  assert.equal(signupError({ status: 401 }).code, "signup_configuration");
});

test("unknown and existing-account failures keep a generic message without provider data", () => {
  const provider = {
    code: "user_already_exists",
    status: 400,
    message: "private@email.test secret-value",
  };
  const output = signupError(provider);
  assert.equal(output.code, "signup_failed");
  assert.ok(!output.message.includes("private@email.test"));
  assert.ok(!output.message.includes("secret-value"));
});
