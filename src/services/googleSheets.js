import { analyzeLog, markFixed, getStats } from './autoFix';

const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL || "";

function getUserId() {
  let userId = localStorage.getItem("astarte_user_id");
  if (!userId) {
    userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("astarte_user_id", userId);
  }
  return userId;
}

export async function callLLM(userMessage) {
  if (!APPS_SCRIPT_URL) {
    throw new Error("Apps Script URL non configurée");
  }

  const userId = getUserId();

  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ message: userMessage, userId: userId })
  });

  if (!response.ok) {
    const diagnosis = analyzeLog({ success: false, action: "fetch", output: `Erreur HTTP ${response.status}` });
    if (diagnosis.issuesFound > 0) {
      diagnosis.fixes.forEach(f => markFixed(f.code));
    }
    throw new Error(`Erreur HTTP ${response.status} | AutoFix: ${diagnosis.fixes.map(f => f.solution).join("; ")}`);
  }

  const data = await response.json();

  if (data.error) {
    const diagnosis = analyzeLog({ success: false, action: "api", output: data.error });
    throw new Error(data.error);
  }

  analyzeLog({ success: true, action: "api", output: `OK via ${data.provider}` });

  return {
    reply: data.reply,
    provider: data.provider || "Inconnu",
    model: data.model || "",
    stats: getStats()
  };
}

export function clearHistory() {
  localStorage.removeItem("astarte_user_id");
}
