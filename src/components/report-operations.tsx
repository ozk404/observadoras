"use client";
import { useEffect, useState } from "react";
import { FollowupPanel } from "./followup-panel";
import { AlertDraftForm } from "./alert-draft-form";
import type { FollowupEntry } from "@/lib/followup-contract";
import type { AlertContext } from "@/lib/alert-contract";
export function ReportOperations({
  id,
  version,
  entries,
  alertContext,
  aiReady,
  className,
}: {
  id: string;
  version: number;
  entries: FollowupEntry[];
  alertContext: AlertContext | null;
  aiReady: boolean;
  className: string;
}) {
  const [currentVersion, setVersion] = useState(version);
  useEffect(() => setVersion((old) => Math.max(old, version)), [version]);
  return (
    <div className={className}>
      <div id="seguimiento">
        <FollowupPanel
          id={id}
          version={version}
          entries={entries}
          onVersionChange={setVersion}
        />
      </div>
      {alertContext && (
        <div id="alerta">
          <AlertDraftForm
            id={id}
            reportVersion={currentVersion}
            context={alertContext}
            aiReady={aiReady}
          />
        </div>
      )}
    </div>
  );
}
