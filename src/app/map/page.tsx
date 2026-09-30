import { MapPinned } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EditableMapLoader } from "@/components/map/editable-map-loader";
import { SectionTitle } from "@/components/dashboard/section-title";
export default function Page() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1800px] space-y-5">
        <PageHeader
          eyebrow="GEOSPATIAL MONITORING"
          title="Peta Situasi"
          description="Visualisasi persebaran kejadian dan status wilayah secara nasional"
        />
        <section className="panel overflow-hidden rounded-xl">
          <SectionTitle icon={MapPinned} title="PETA OPERASIONAL INDONESIA" />
          <div className="[&_.leaflet-container]:h-[calc(100vh-220px)]">
            <EditableMapLoader />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
