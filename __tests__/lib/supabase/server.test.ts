jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

describe("createServerClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-test";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("calls createClient with SUPABASE_URL and SERVICE_ROLE_KEY", () => {
    createServerClient();
    expect(createClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "service-role-key-test"
    );
  });

  it("calls createClient exactly once", () => {
    createServerClient();
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
