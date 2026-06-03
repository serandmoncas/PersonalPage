/**
 * @jest-environment node
 */
const mockUpsert = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({ upsert: mockUpsert })),
  })),
}));

import { POST } from "@/app/api/newsletter/route";

describe("POST /api/newsletter", () => {
  const SUPABASE_URL = "https://test.supabase.co";
  const SUPABASE_KEY = "service-key";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_KEY;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  function makeRequest(body: unknown) {
    return new Request("http://localhost/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 and calls upsert on valid email", async () => {
    mockUpsert.mockResolvedValue({ error: null });
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(201);
    expect(mockUpsert).toHaveBeenCalledWith(
      { email: "user@example.com", is_active: true },
      { onConflict: "email" }
    );
  });

  it("returns 201 (graceful degradation) when env vars missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(201);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 500 on Supabase error", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "DB error" } });
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(500);
  });

  it("normalizes email to lowercase", async () => {
    mockUpsert.mockResolvedValue({ error: null });
    await POST(makeRequest({ email: "USER@EXAMPLE.COM" }));
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com" }),
      expect.anything()
    );
  });
});
