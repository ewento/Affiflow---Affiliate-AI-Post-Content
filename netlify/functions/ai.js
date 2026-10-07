const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export default async (request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: cors,
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  // Read OpenRouter API key
  let apiKey = "";

  try {
    if (
      typeof Netlify !== "undefined" &&
      Netlify?.env &&
      typeof Netlify.env.get === "function"
    ) {
      apiKey = Netlify.env.get("OPENROUTER_API_KEY") || "";
    }
  } catch (error) {
    console.error("Netlify.env.get error:", error?.message);
  }

  // Fallback
  if (!apiKey && typeof process !== "undefined" && process.env) {
    apiKey = process.env.OPENROUTER_API_KEY || "";
  }

  console.log("=== AffiliFlow AI Diagnostic ===");
  console.log("API key present:", Boolean(apiKey));

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is NOT available.");
    
    return json(
      {
        error: "OPENROUTER_API_KEY tidak dapat dibaca oleh Netlify Function.",
        diagnostic: "KEY_PRESENT=false",
      },
      500,
      cors
    );
  }

  let body;

  try {
    body = await request.json();

    console.log(
      "Request received. Body size:",
      JSON.stringify(body).length,
      "bytes"
    );

    console.log(
      "Model requested:",
      body?.model || "not specified"
    );
  } catch (error) {
    console.error("JSON parse error:", error?.message);

    return json(
      {
        error: "Request JSON tidak sah.",
        diagnostic: "KEY_PRESENT=true",
      },
      400,
      cors
    );
  }

  try {
    console.log("Sending request to OpenRouter...");

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://affiflow.netlify.app",
        "X-Title": "AffiliFlow AI",
      },
      body: JSON.stringify(body),
    });

    const resultText = await response.text();

    console.log("OpenRouter HTTP status:", response.status);
    console.log("OpenRouter response:", resultText);

    let result;

    try {
      result = JSON.parse(resultText);
    } catch {
      result = {
        error: {
          message:
            resultText ||
            "OpenRouter returned an invalid response.",
        },
      };
    }

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: {
        ...cors,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });

  } catch (error) {
    console.error(
      "OpenRouter network/fetch error:",
      error?.message
    );

    return json(
      {
        error:
          error?.message ||
          "OpenRouter request failed.",
        diagnostic: "KEY_PRESENT=true",
      },
      502,
      cors
    );
  }
};

function json(payload, status, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
