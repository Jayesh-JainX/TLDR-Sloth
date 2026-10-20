import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Verify API key exists
if (!process.env.OPENROUTER_API_KEY) {
  console.error("CRITICAL ERROR: OPENROUTER_API_KEY is missing from .env file");
  process.exit(1);
}

// Model selection - using Llama 3.1 8B Instruct (Free Tier)
const modelName =
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

// Main Summarization Endpoint
app.post("/api/summarize", async (req, res) => {
  const { chatLog } = req.body;

  if (!chatLog) {
    return res.status(400).json({ error: "A chatLog string is required." });
  }

  try {
    // 1. Sloth-themed prompt forcing strict JSON format
    const systemPrompt = `You are a highly efficient, lazy assistant. Read the following chaotic group chat log and provide a concise summary.
You MUST return your evaluation in ONLY raw, valid JSON format. Do not include markdown, backticks, explanations, or any conversational text before or after the JSON.
The JSON must contain exactly three keys:
{
  "tldr": "A one-sentence summary of the entire conversation.",
  "action_items": ["Array item 1: Did anyone ask me to do anything?", "Array item 2: Are there plans to meet up?"],
  "drama": "A one-sentence summary of any arguments, funny moments, or tension. (Say 'None' if everyone is getting along)"
}`;

    const userPrompt = `CHAT LOG:\n${chatLog}`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "TLDR Sloth",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1, // Low temperature for strict JSON determinism
          top_p: 0.9,
          max_tokens: 1500,
          // Enforce JSON mode natively
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!response.ok) {
      // Improved error logging to see exact API rejections (e.g., 502s)
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status}\n${errorData}`);
    }

    const data = await response.json();
    let outputText = data.choices[0].message.content.trim();

    // 2. Robust JSON Extraction Logic (Handles Truncation & Escaping Errors)
    let summaryResult;

    // Pre-cleaner: Strip markdown code blocks if the 8B model hallucinates them
    outputText = outputText.replace(/^```(json)?|```$/gi, "").trim();

    try {
      // First, try standard parsing
      summaryResult = JSON.parse(outputText);
    } catch (parseError) {
      console.warn(
        "Standard parsing failed, attempting boundary extraction...",
      );
      try {
        // Boundary Extraction: Find everything between the first '{' and the last '}'
        const firstBrace = outputText.indexOf("{");
        const lastBrace = outputText.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonString = outputText.substring(firstBrace, lastBrace + 1);
          summaryResult = JSON.parse(jsonString);
        } else {
          throw new Error("No JSON object found in response boundaries");
        }
      } catch (boundaryError) {
        console.warn(
          "Boundary extraction failed, attempting aggressive Regex extraction (Likely Truncated Output)...",
        );

        try {
          // Aggressive Regex tailored for the Sloth Schema
          const tldrMatch = outputText.match(/"tldr"\s*:\s*"([^"]+)"/i);
          const dramaMatch = outputText.match(/"drama"\s*:\s*"([^"]+)"/i);

          // Try to extract items in an array format using basic regex
          const actionItemsMatch = outputText.match(
            /"action_items"\s*:\s*\[(.*?)\]/is,
          );
          let extractedActions = ["No action items detected."];

          if (actionItemsMatch && actionItemsMatch[1]) {
            // Very naive split by quotes to grab array items if it broke
            const matches = actionItemsMatch[1].match(/"([^"]+)"/g);
            if (matches) {
              extractedActions = matches.map((str) => str.replace(/"/g, ""));
            }
          }

          if (tldrMatch || dramaMatch) {
            summaryResult = {
              tldr: tldrMatch
                ? tldrMatch[1].replace(/\\n/g, "\n").trim()
                : "Summary truncated.",
              action_items: extractedActions,
              drama: dramaMatch
                ? dramaMatch[1].replace(/\\n/g, "\n").trim()
                : "Drama summary truncated.",
            };
          } else {
            throw new Error("Regex extraction failed");
          }
        } catch (regexError) {
          console.error(
            "All extraction methods failed. Raw output:",
            outputText,
          );
          summaryResult = {
            tldr: "Error: The AI model truncated the response or formatting failed.",
            action_items: ["Please try clicking 'Summarize' again."],
            drama: "Raw output: " + outputText.substring(0, 100) + "...",
          };
        }
      }
    }

    // Failsafe: Ensure all keys exist and are of the correct type for the frontend
    if (!summaryResult.tldr) summaryResult.tldr = "No summary generated.";
    if (!summaryResult.drama) summaryResult.drama = "No drama detected.";
    if (
      !summaryResult.action_items ||
      !Array.isArray(summaryResult.action_items)
    ) {
      summaryResult.action_items = ["No clear action items found."];
    }

    res.json(summaryResult);
  } catch (error) {
    console.error("Error during OpenRouter API call:", error);
    res
      .status(500)
      .json({ error: "Failed to generate summary due to server error." });
  }
});

app.listen(PORT, () => {
  console.log(`TL;DR Sloth Server running on http://localhost:${PORT}`);
  console.log(`Using Open-Weight Model: ${modelName} via OpenRouter`);
});
