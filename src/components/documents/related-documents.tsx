"use client";
import { Download, FileText, LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
type DocumentItem = {
  id: string;
  filename: string;
  mimeType: string | null;
  uploadedBy: string;
  createdAt: string;
};
export function RelatedDocuments({
  incidentId,
  initialDocuments,
  canUpload,
}: {
  incidentId: string;
  initialDocuments: DocumentItem[];
  canUpload: boolean;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function upload() {
    const file = input.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    const body = new FormData();
    body.set("file", file);
    const response = await fetch(`/api/incidents/${incidentId}/documents`, { method: "POST", body });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Upload gagal");
      return;
    }
    setDocuments((current) => [
      { ...payload, createdAt: payload.createdAt },
      ...current.filter((item) => item.id !== payload.id),
    ]);
    if (input.current) input.current.value = "";
    setMessage("Dokumen tersimpan di server ATLAS.");
  }
  return (
    <section className="panel rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-semibold tracking-[.18em] text-cyan-400">ARSIP DOKUMEN</p>
          <h2 className="mt-1 text-lg font-semibold">Dokumen Terkait</h2>
          <p className="mt-1 text-xs text-slate-500">
            File tersimpan di server ATLAS dan hanya dapat diunduh lewat izin ATLAS.
          </p>
        </div>
        {canUpload && (
          <div className="flex items-center gap-2">
            <input
              ref={input}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.pptx"
              className="max-w-56 text-[10px] text-slate-400 file:mr-2 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-200"
            />
            <button
              onClick={upload}
              disabled={busy}
              className="flex h-9 items-center gap-2 rounded-lg bg-cyan-500 px-3 text-[10px] font-bold text-slate-950 disabled:opacity-50"
            >
              {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Upload size={14} />}UPLOAD
            </button>
          </div>
        )}
      </div>
      {message && (
        <p
          role="status"
          className={`mt-4 text-xs ${message.includes("tersimpan") ? "text-emerald-400" : "text-rose-400"}`}
        >
          {message}
        </p>
      )}
      <div className="mt-5 divide-y divide-slate-800 rounded-lg border border-slate-800">
        {documents.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-500">Belum ada dokumen terkait.</p>
        ) : (
          documents.map((document) => (
            <div key={document.id} className="flex items-center justify-between gap-4 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                  <FileText size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-200">{document.filename}</p>
                  <p className="mt-1 text-[9px] text-slate-600">
                    {new Date(document.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                  </p>
                </div>
              </div>
              <a
                href={`/api/incidents/${incidentId}/documents/${document.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-[10px] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
              >
                <Download size={13} /> Download
              </a>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
