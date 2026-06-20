const FIXES = {
  cors: {
    pattern: /CORS|Cross-Origin|preflight|OPTIONS/i,
    solution: "Content-Type text/plain au lieu de application/json pour éviter le preflight OPTIONS",
    applied: false
  },
  moduleNotFound: {
    pattern: /MODULE_NOT_FOUND|Cannot find module/i,
    solution: "rm -rf node_modules package-lock.json && npm install",
    applied: false
  },
  openSSL: {
    pattern: /OPENSSL|libcrypto|libssl/i,
    solution: "unset LD_LIBRARY_PATH avant d'exécuter node/npm",
    applied: false
  },
  buildFail: {
    pattern: /Failed to compile|Build failed|SyntaxError/i,
    solution: "Vérifier la syntaxe JSX et les imports dans les fichiers source",
    applied: false
  },
  apiKey: {
    pattern: /401|403|Unauthorized|Invalid API key/i,
    solution: "Vérifier que les clés API dans le Sheet (colonnes A/B/C) sont valides",
    applied: false
  },
  sheetAccess: {
    pattern: /Sheet inaccessible|getDataRange|undefined/i,
    solution: "Utiliser SpreadsheetApp.openById() avec l'ID exact du Sheet",
    applied: false
  },
  rateLimit: {
    pattern: /429|Too Many Requests|rate limit/i,
    solution: "Ajouter un délai entre les requêtes ou réduire MAX_HISTORY_TOKENS",
    applied: false
  },
  timeout: {
    pattern: /TIMEOUT|timeout|dépassé/i,
    solution: "Augmenter le timeout ou diviser la tâche en sous-tâches",
    applied: false
  }
};

const LOG_HISTORY = [];

export function analyzeLog(logEntry) {
  LOG_HISTORY.push({
    timestamp: new Date().toISOString(),
    ...logEntry
  });

  const results = [];
  const message = logEntry.output || logEntry.error || "";

  for (const [key, fix] of Object.entries(FIXES)) {
    if (fix.pattern.test(message) && !fix.applied) {
      results.push({
        code: key,
        solution: fix.solution,
        severity: key === "cors" || key === "apiKey" ? "critique" : "moyen"
      });
    }
  }

  return {
    analyzed: true,
    issuesFound: results.length,
    fixes: results,
    historyCount: LOG_HISTORY.length
  };
}

export function markFixed(code) {
  if (FIXES[code]) {
    FIXES[code].applied = true;
  }
}

export function getStats() {
  const total = LOG_HISTORY.length;
  const errors = LOG_HISTORY.filter(l => !l.success).length;
  const fixesApplied = Object.values(FIXES).filter(f => f.applied).length;
  return { total, errors, fixesApplied, successRate: total > 0 ? Math.round((total - errors) / total * 100) : 100 };
}

export function resetAll() {
  Object.keys(FIXES).forEach(k => { FIXES[k].applied = false; });
  LOG_HISTORY.length = 0;
}
