import { createFileRoute, redirect } from "@tanstack/react-router";

// Inventory 2 is the main inventory now — send /inventory to /inventory2.
export const Route = createFileRoute("/_app/inventory/")({
  beforeLoad: () => {
    throw redirect({ to: "/inventory2" });
  },
});
