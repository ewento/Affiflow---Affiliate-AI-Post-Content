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

  // Read the secret from Netlify Runtime Environment.
  let apiKey = "";

  try {
    if (
      typeof Netlify !== "undefined" &&
      Netlify?.env &&
      typeof Netlify.env.get === "function"
    ) {
      apiKey = Netlify.env.get("OPENROUTER_API_KEY") || "";
    }
  } catch (e) {
    // Continue to process.env fallback.
  }

  // Fallback for environments where process.env is available.
  if (!apiKey && typeof process !== "undefined" && process.env) {
    apiKey = process.env.OPENROUTER_API_KEY || "";
  }

  if (!apiKey) {
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
  } catch {
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

    let result;

    try {
      result = JSON.parse(resultText);
    } catch {
      result = {
        error: {
          message: resultText || "OpenRouter returned an invalid response.",
        },
      };
    }

    // Return OpenRouter response to the frontend.
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: {
        ...cors,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return json(
      {
        error: error?.message || "OpenRouter request failed.",
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
