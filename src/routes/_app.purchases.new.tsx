import { createFileRoute, redirect } from "@tanstack/react-router";

// Old purchase entry replaced by Purchase 2 — send any link here to /purchases2.
export const Route = createFileRoute("/_app/purchases/new")({
  beforeLoad: () => {
    throw redirect({ to: "/purchases2" });
  },
});
