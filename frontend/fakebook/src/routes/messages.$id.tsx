import { createFileRoute, useParams } from "@tanstack/react-router";
import { Route as MessagesRoute } from "./messages";

export const Route = createFileRoute("/messages/$id")({
  head: () => ({ meta: [{ title: "Messages — Pulse" }] }),
  component: () => {
    // Reuse the messages page; selectedId is read from params
    const Component = MessagesRoute.options.component!;
    return <Component />;
  },
});
