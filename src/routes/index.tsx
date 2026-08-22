import { createFileRoute } from "@tanstack/react-router";
import { DeadSignal } from "@/components/dead-signal";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DeadSignal />;
}
