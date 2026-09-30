"use client";
import { OperationalPage } from "@/components/modules/operational-page";
import { moduleData } from "@/data/modules";
export default function Page() {
  return <OperationalPage config={moduleData.bencana} />;
}
