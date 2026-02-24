"use client";

import DataExport from "./DataExport";

export default function DataManagementCard() {
  return (
    <div className="glass-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Data Management
      </h3>

      <DataExport />
    </div>
  );
}
