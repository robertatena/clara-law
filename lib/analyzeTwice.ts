export type AnalyzeResult = {
  ok: boolean;
  hits: unknown[];
  extracted_chars?: number;
  error?: string;
};
function scoreResult(r: AnalyzeResult) {
  return (r?.hits?.length ?? 0) * 10 + (r?.extracted_chars ?? 0) / 1000;
}
function compareResults(a: AnalyzeResult, b: AnalyzeResult) {
  const sameHitsCount = (a?.hits?.length ?? 0) === (b?.hits?.length ?? 0);
  const sameOk = a?.ok === b?.ok;
  return sameOk && sameHitsCount;
}
export async function analyzeTwice(payload: unknown): Promise<{
  best: AnalyzeResult;
  second: AnalyzeResult;
  consistent: boolean;
}> {
  const [r1, r2] = await Promise.all([
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
  ]);
  const best = scoreResult(r2) > scoreResult(r1) ? r2 : r1;
  const second = best === r1 ? r2 : r1;
  return { best, second, consistent: compareResults(r1, r2) };
}
