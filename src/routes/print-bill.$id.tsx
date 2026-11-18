import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/print-bill/$id")({
  component: () => null,
});
