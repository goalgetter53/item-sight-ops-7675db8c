import { createFileRoute, redirect } from "@tanstack/react-router";

// Old sale entry replaced by Sales 2 — send any link here to /sales2.
export const Route = createFileRoute("/_app/sales/new")({
  beforeLoad: () => {
    throw redirect({ to: "/sales2" });
  },
});
