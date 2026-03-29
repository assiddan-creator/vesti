import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { productUrl, userHeight, bodyAnalysis } = await req.json();

  // שלב 1 — שלוף את תוכן דף המוצר
  let productHtml = "";
  try {
    const res = await fetch(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    productHtml = await res.text();
    // חתוך ל-15000 תווים כדי לא לעבור את הגבול
    productHtml = productHtml.slice(0, 15000);
  } catch {
    productHtml = "Could not fetch page content";
  }

  // שלב 2 — שלח לקלוד לניתוח
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a fashion sizing expert. Analyze this product page HTML and the user's body info to recommend the right size.

User info:
- Height: ${userHeight} cm
- Body type analysis: ${bodyAnalysis}

Product page HTML (first 15000 chars):
${productHtml}

Tasks:
1. Extract the size chart from the HTML if it exists (look for tables, size guides, measurements in cm/inches)
2. Identify which brand/store this is (AliExpress, Shein, ASOS, Zara, etc.)
3. Consider that Asian sizing (AliExpress, Shein) runs 1-2 sizes smaller than Western sizing
4. Recommend the best size for this user

Return ONLY a JSON object with these fields:
{
  "store": "store name",
  "productName": "product name if found",
  "recommendedSize": "S/M/L/XL/etc",
  "confidence": "high/medium/low",
  "reasoning": "2-3 sentences explaining why this size, mentioning sizing differences between countries if relevant",
  "sizeChart": "brief summary of the size chart found, or null if not found",
  "warning": "any important warning about fit, material stretch, etc, or null"
}
No markdown, no explanation, just JSON.`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "{}";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not parse response", raw: text });
  }
}
