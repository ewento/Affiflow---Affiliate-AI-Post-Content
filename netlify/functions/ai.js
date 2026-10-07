const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }

  const apiKey = Netlify.env.get("OPENROUTER_API_KEY");

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "OPENROUTER_API_KEY belum ditetapkan di Netlify Environment Variables."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://affiflow.netlify.app",
        "X-Title": "AffiliFlow AI"
      },
      body: JSON.stringify(body)
    });

    const result = await response.text();

    return new Response(result, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error?.message || "OpenRouter request failed."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};
