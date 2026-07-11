"use client";

import { useRef, useState, useTransition } from "react";
import { parseCSV, templateText, sampleText } from "@/lib/csv";
import { dateLabel } from "@/lib/format";
import { monthLabel as formatMonthLabel } from "@/lib/format";
import { money, num } from "@/lib/format";
import { confirmCsv } from "@/app/submit/actions";
import type { ParsedSubmission } from "@/lib/types";
import styles from "./CsvUpload.module.css";

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CsvUpload({
  onSubmitted,
}: {
  onSubmitted: (result: { church: string; monthLabel: string }) => void;
}) {
  const [fileName, setFileName] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedSubmission | null>(null);
  const [errorList, setErrorList] = useState<string[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleText(text: string, name: string) {
    const result = parseCSV(text);
    setFileName(name);
    setRawText(text);
    if (result.ok) {
      setParsed(result.data);
      setErrorList(null);
    } else {
      setParsed(null);
      setErrorList(result.errors);
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => handleText(String(rd.result), f.name);
    rd.readAsText(f);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => handleText(String(rd.result), f.name);
    rd.readAsText(f);
  }

  function resetUpload() {
    setFileName("");
    setRawText("");
    setParsed(null);
    setErrorList(null);
  }

  function confirmUpload() {
    startTransition(async () => {
      const result = await confirmCsv(rawText);
      if (!result.ok) {
        setParsed(null);
        setErrorList(result.errors);
        return;
      }
      onSubmitted(result);
    });
  }

  const showDrop = !parsed && !errorList;

  return (
    <>
      <div className={styles.steps}>
        <div className={styles.stepCard}>
          <div className={styles.stepNum}>1</div>
          <div className={styles.stepTitle}>Download template</div>
          <div className={styles.stepBody}>A ready-made CSV with all four sections.</div>
        </div>
        <div className={styles.stepCard}>
          <div className={styles.stepNum}>2</div>
          <div className={styles.stepTitle}>Fill in your month</div>
          <div className={styles.stepBody}>One row per Sunday. Save as CSV.</div>
        </div>
        <div className={styles.stepCard}>
          <div className={styles.stepNum}>3</div>
          <div className={styles.stepTitle}>Upload &amp; review</div>
          <div className={styles.stepBody}>We check it, you confirm, done.</div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.downloadBtn}
          onClick={() => downloadText(templateText(), "HPCI_Monthly_Report_Template.csv")}
        >
          <span style={{ fontSize: 16 }}>↓</span> Download blank template
        </button>
        <button
          type="button"
          className={styles.sampleBtn}
          onClick={() => handleText(sampleText(), "HPCI_Johanan_June_2026_SAMPLE.csv")}
        >
          Try a filled sample file
        </button>
      </div>

      {showDrop ? (
        <label
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragOver) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          className={`${styles.dropzone} ${dragOver ? styles.dropzoneOver : ""}`}
        >
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={onFileInput} style={{ display: "none" }} />
          <div className={styles.dropIcon}>⬆</div>
          <div className={styles.dropTitle}>Drop your completed CSV here</div>
          <div className={styles.dropSubtitle}>
            or <span className={styles.browseLink}>browse files</span> · .csv only
          </div>
        </label>
      ) : null}

      {errorList ? (
        <div className={styles.errorBox}>
          <div className={styles.errorHeader}>
            <span className={styles.errorDot}>!</span> We couldn&apos;t accept &quot;{fileName}&quot;
          </div>
          <ul className={styles.errorList}>
            {errorList.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
          <button type="button" onClick={resetUpload} className={styles.tryAgainBtn}>
            Try another file
          </button>
        </div>
      ) : null}

      {parsed ? (
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <span className={styles.previewHeaderIcon}>✓</span>
            <div style={{ flex: 1 }}>
              <div className={styles.previewHeaderTitle}>Looks good — review before submitting</div>
              <div className={styles.previewHeaderSubtitle}>Parsed from {fileName}</div>
            </div>
          </div>
          <div className={styles.previewBody}>
            <div className={styles.previewMeta}>
              <div>
                <div className={styles.previewMetaLabel}>Local Church</div>
                <div className={styles.previewMetaValue}>{parsed.church}</div>
              </div>
              <div>
                <div className={styles.previewMetaLabel}>Report Month</div>
                <div className={styles.previewMetaValue}>{formatMonthLabel(parsed.monthKey)}</div>
              </div>
              <div>
                <div className={styles.previewMetaLabel}>Sundays</div>
                <div className={styles.previewMetaValue}>{parsed.weeks.length}</div>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: "nowrap" }}>Sunday</th>
                    <th style={{ textAlign: "right" }}>Regulars</th>
                    <th style={{ textAlign: "right" }}>VIP</th>
                    <th style={{ textAlign: "right" }}>Tithes &amp; Offering</th>
                    <th>Sermon</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.weeks.map((w) => (
                    <tr key={w.date}>
                      <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{dateLabel(w.date)}</td>
                      <td style={{ textAlign: "right" }}>{num(w.regulars)}</td>
                      <td style={{ textAlign: "right", color: "var(--accent)", fontWeight: 600 }}>{w.vip}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{money(w.giving)}</td>
                      <td style={{ color: "#475467" }}>{w.sermon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.previewCards}>
              <div className={styles.winsCard}>
                <div className={styles.cardLabel} style={{ color: "var(--positive-ink)" }}>
                  WINS
                </div>
                <div style={{ fontSize: 13, color: "#155e45", lineHeight: 1.5 }}>{parsed.wins}</div>
              </div>
              <div className={styles.challengesCard}>
                <div className={styles.cardLabel} style={{ color: "var(--warning)" }}>
                  CHALLENGES
                </div>
                <div style={{ fontSize: 13, color: "#7c4a12", lineHeight: 1.5 }}>{parsed.challenges}</div>
              </div>
            </div>
          </div>
          <div className={styles.previewFooter}>
            <button type="button" onClick={resetUpload} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="button" onClick={confirmUpload} disabled={isPending} className={styles.confirmBtn}>
              {isPending ? "Submitting…" : "Submit to leadership →"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
