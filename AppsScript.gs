var PROVIDER_CONFIGS = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    models: ["llama-3.3-70b-versatile", "llama3-70b-8192", "mixtral-8x7b-32768", "gemma2-9b-it"]
  },
  fireworks: {
    url: "https://api.fireworks.ai/inference/v1/chat/completions",
    models: ["accounts/fireworks/models/llama-v3p3-70b-instruct", "accounts/fireworks/models/mixtral-8x7b-instruct"]
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    models: ["meta-llama/llama-3.3-70b-instruct", "mistralai/mixtral-8x7b-instruct", "anthropic/claude-3-haiku", "google/gemini-flash-1.5"]
  }
};

var SYSTEM_PROMPT = "Tu es Astarté, une IA éducative créée par TSEK le Lion d'Astarté. Tu aides les élèves du lycée et du supérieur. Tu es bienveillante, précise et pédagogue. Tu réponds en français.";

var HISTORY_COLUMN = 7;
var USERID_COLUMN = 8;
var MAX_HISTORY_TOKENS = 6000;

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return sendJson({ error: "Requête invalide" });
    }

    var data = safeParse(e.postData.contents);
    if (!data) {
      return sendJson({ error: "JSON invalide" });
    }

    var userMessage = (data.message || "").toString().trim();
    var userId = (data.userId || "anonymous").toString().trim();

    if (!userMessage) {
      return sendJson({ error: "Message vide" });
    }

    var sheet = safeGetSheet();
    if (!sheet) {
      return sendJson({ error: "Sheet inaccessible" });
    }

    var providers = loadProviders(sheet);
    if (providers.length === 0) {
      return sendJson({ error: "Aucun fournisseur configuré dans le Sheet" });
    }

    var selected = providers[Math.floor(Math.random() * providers.length)];

    var history = getUserHistory(sheet, userId);
    history.push({ role: "user", content: userMessage });

    var systemTokens = countTokens(SYSTEM_PROMPT);
    var availableTokens = MAX_HISTORY_TOKENS - systemTokens - 1024;

    var trimmedHistory = [];
    var tokenCount = 0;

    for (var h = history.length - 1; h >= 0; h--) {
      var content = history[h] && history[h].content ? history[h].content.toString() : "";
      var msgTokens = countTokens(content);
      if (tokenCount + msgTokens <= availableTokens) {
        trimmedHistory.unshift({ role: history[h].role, content: content });
        tokenCount += msgTokens;
      } else {
        break;
      }
    }

    var messages = [{ role: "system", content: SYSTEM_PROMPT }];
    messages = messages.concat(trimmedHistory);

    var payload = {
      model: selected.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024
    };

    var headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + selected.apiKey
    };

    if (selected.type === "openrouter") {
      headers["HTTP-Referer"] = "https://astarte.app";
      headers["X-Title"] = "Astarte Assistant";
    }

    var options = {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(selected.url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    if (responseCode !== 200) {
      return sendJson({
        error: "Erreur API " + selected.type + ": " + responseCode,
        details: responseText
      });
    }

    var responseBody = safeParse(responseText);
    if (!responseBody || !responseBody.choices || !responseBody.choices[0]) {
      return sendJson({ error: "Réponse API invalide", raw: responseText.substring(0, 200) });
    }

    var reply = responseBody.choices[0].message.content;

    trimmedHistory.push({ role: "assistant", content: reply });
    saveUserHistory(sheet, userId, trimmedHistory);

    return sendJson({
      reply: reply,
      provider: selected.name,
      model: selected.model,
      type: selected.type
    });

  } catch (error) {
    return sendJson({
      error: "Erreur serveur: " + error.toString()
    });
  }
}

function safeGetSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return null;
    var sheet = ss.getActiveSheet();
    if (!sheet) sheet = ss.getSheets()[0];
    return sheet || null;
  } catch(e) {
    return null;
  }
}

function loadProviders(sheet) {
  var providers = [];
  try {
    var rows = sheet.getDataRange().getValues();
    if (!rows || rows.length < 2) return [];

    for (var i = 1; i < rows.length; i++) {
      var groqKey       = rows[i][0] ? rows[i][0].toString().trim() : "";
      var fireworksKey  = rows[i][1] ? rows[i][1].toString().trim() : "";
      var openrouterKey = rows[i][2] ? rows[i][2].toString().trim() : "";

      if (groqKey && PROVIDER_CONFIGS.groq) {
        var gModel = rows[i][3] ? rows[i][3].toString().trim() : PROVIDER_CONFIGS.groq.models[0];
        providers.push({
          apiKey: groqKey,
          type: "groq",
          name: "Groq-" + i,
          model: gModel,
          url: PROVIDER_CONFIGS.groq.url
        });
      }

      if (fireworksKey && PROVIDER_CONFIGS.fireworks) {
        var fModel = rows[i][4] ? rows[i][4].toString().trim() : PROVIDER_CONFIGS.fireworks.models[0];
        providers.push({
          apiKey: fireworksKey,
          type: "fireworks",
          name: "Fireworks-" + i,
          model: fModel,
          url: PROVIDER_CONFIGS.fireworks.url
        });
      }

      if (openrouterKey && PROVIDER_CONFIGS.openrouter) {
        var oModel = rows[i][5] ? rows[i][5].toString().trim() : PROVIDER_CONFIGS.openrouter.models[0];
        providers.push({
          apiKey: openrouterKey,
          type: "openrouter",
          name: "OpenRouter-" + i,
          model: oModel,
          url: PROVIDER_CONFIGS.openrouter.url
        });
      }
    }
  } catch(e) {
    Logger.log("loadProviders error: " + e.toString());
  }
  return providers;
}

function getUserHistory(sheet, userId) {
  try {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var uid = data[i][USERID_COLUMN - 1] ? data[i][USERID_COLUMN - 1].toString().trim() : "";
      if (uid === userId) {
        var raw = data[i][HISTORY_COLUMN - 1] ? data[i][HISTORY_COLUMN - 1].toString().trim() : "";
        if (raw) {
          var parsed = safeParse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
        return [];
      }
    }
  } catch(e) {
    Logger.log("getUserHistory error: " + e.toString());
  }
  return [];
}

function saveUserHistory(sheet, userId, history) {
  try {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var uid = data[i][USERID_COLUMN - 1] ? data[i][USERID_COLUMN - 1].toString().trim() : "";
      if (uid === userId) {
        sheet.getRange(i + 1, HISTORY_COLUMN).setValue(JSON.stringify(history));
        return;
      }
    }
    var newRow = data.length + 1;
    sheet.getRange(newRow, USERID_COLUMN).setValue(userId);
    sheet.getRange(newRow, HISTORY_COLUMN).setValue(JSON.stringify(history));
  } catch(e) {
    Logger.log("saveUserHistory error: " + e.toString());
  }
}

function countTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.toString().length / 4);
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return null;
  }
}

function sendJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return sendJson({
    status: "Astarté Apps Script opérationnel",
    timestamp: new Date().toISOString()
  });
}
