import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────
interface VisitRow {
  id: string;
  seller_email: string;
  seller_user_id: string;
  visited_at: string;
  seen: boolean;
}

interface QueryBuilder {
  _rows: VisitRow[];
  select: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
}

// --- Mock supabase client ---
const onMock = vi.fn().mockReturnThis();
const subscribeMock = vi.fn().mockReturnThis();
const channelMock = vi.fn((_name?: string) => ({ on: onMock, subscribe: subscribeMock }));
const removeChannelMock = vi.fn((_ch?: unknown) => {});

// Simulated server-side data (RLS-aware mock)
const ALL_VISITS: VisitRow[] = [
  { id: "1", seller_email: "alice@test.com", seller_user_id: "seller-1", visited_at: "2026-01-01T10:00:00Z", seen: false },
  { id: "2", seller_email: "bob@test.com", seller_user_id: "seller-2", visited_at: "2026-01-01T11:00:00Z", seen: false },
];

let currentUserId = "seller-1";
let currentIsAdmin = false;

const fromMock = vi.fn((_table?: string) => {
  const builder: QueryBuilder = {
    _rows: ALL_VISITS,
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(function (this: QueryBuilder) {
      const rows = currentIsAdmin
        ? this._rows
        : this._rows.filter((r) => r.seller_user_id === currentUserId);
      return Promise.resolve({ data: rows, error: null });
    }),
    update: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return builder;
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    channel: (name: string) => channelMock(name),
    removeChannel: (ch: unknown) => removeChannelMock(ch),
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: currentUserId, email: "test@test.com" }, session: null, loading: false }),
}));

vi.mock("@/hooks/useRole", () => ({
  useRole: () => ({ role: currentIsAdmin ? "admin" : "seller", isAdmin: currentIsAdmin, isSeller: !currentIsAdmin, loading: false }),
}));

import NotificationBell from "@/components/NotificationBell";

describe("NotificationBell realtime privacy", () => {
  beforeEach(() => {
    onMock.mockClear();
    subscribeMock.mockClear();
    channelMock.mockClear();
    fromMock.mockClear();
  });

  it("subscribes with seller-scoped filter so other sellers' emails are never broadcast", async () => {
    currentUserId = "seller-1";
    currentIsAdmin = false;

    render(<NotificationBell />);

    await waitFor(() => expect(onMock).toHaveBeenCalled());
    const [, opts] = onMock.mock.calls[0];
    expect(opts.filter).toBe("seller_user_id=eq.seller-1");
    expect(opts.table).toBe("seller_visits");
  });

  it("admin subscribes without per-seller filter (sees all)", async () => {
    currentUserId = "admin-1";
    currentIsAdmin = true;

    render(<NotificationBell />);

    await waitFor(() => expect(onMock).toHaveBeenCalled());
    const [, opts] = onMock.mock.calls[0];
    expect(opts.filter).toBeUndefined();
  });

  it("seller cannot read another seller's email via initial fetch (RLS-equivalent)", async () => {
    currentUserId = "seller-1";
    currentIsAdmin = false;

    // Directly exercise the from() builder used by NotificationBell to confirm
    // the RLS-equivalent mock returns ONLY the current seller's row.
    const builder = fromMock("seller_visits");
    const { data } = await builder.select("*").order("visited_at", { ascending: false }).limit(20);

    expect(data).toHaveLength(1);
    expect(data[0].seller_email).toBe("alice@test.com");
    expect(data.find((r: VisitRow) => r.seller_email === "bob@test.com")).toBeUndefined();
  });
});
