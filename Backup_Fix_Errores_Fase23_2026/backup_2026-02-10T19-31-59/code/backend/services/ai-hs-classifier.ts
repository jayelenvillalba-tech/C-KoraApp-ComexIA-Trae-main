
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HSCode } from "../models/HSCode";
import dotenv from 'dotenv';
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY not defined. AI features will not work.");
}

const llm = new ChatOpenAI({ 
  modelName: "gpt-4o",
  temperature: 0.1,
  openAIApiKey: OPENAI_API_KEY
});

// Define the output parser
const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    hsCode: z.string().describe("The most likely 6-digit HS code"),
    confidence: z.number().describe("Confidence score between 0 and 1"),
    reasoning: z.string().describe("Explanation for why this code was chosen"),
    alternatives: z.array(z.object({
      code: z.string(),
      description: z.string(),
      confidence: z.number()
    })).describe("Alternative classification options")
  })
);

const classificationPrompt = PromptTemplate.fromTemplate(`
You are an expert in HS (Harmonized System) code classification for international trade.
Your task is to classify a product description into the most specific HS code (preferably 6-digit).

Product Description: {productDescription}
Origin Country: {originCountry}
Additional Context: {context}

Relevant HS Codes from Database (for reference):
{hsCodesContext}

Analyze the product based on its material, function, and processing level.
Determine the correct Chapter, Heading, and Subheading.
Provide a confidence score.
If the description is vague, provide the best guess with lower confidence.

{format_instructions}
`);

export async function classifyProductHS(
  description: string,
  originCountry?: string,
  context?: string
) {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API Key missing");
  }

  // 1. Retrieve potential HS code context from database (keywords search)
  // MongoDB filters with text search
  let relevantContext = "";
  try {
    const hits = await HSCode.find(
      { $text: { $search: description } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(5);
    
    if (hits.length > 0) {
      relevantContext = hits.map(h => `${h.code}: ${h.description} (${h.descriptionEn})`).join("\n");
    }
  } catch (err) {
    console.warn("Vector/Text search failed or not indexed yet:", err);
  }

  // 2. Format prompt
  const formatInstructions = parser.getFormatInstructions();
  
  const chain = classificationPrompt.pipe(llm).pipe(parser);
  
  // 3. Invoke LLM
  try {
    const result = await chain.invoke({
      productDescription: description,
      originCountry: originCountry || "Unknown",
      context: context || "",
      hsCodesContext: relevantContext,
      format_instructions: formatInstructions
    });
    
    return result;
  } catch (error) {
    console.error("AI Classification Error:", error);
    throw error;
  }
}

export async function suggestHSCode(query: string) {
  // Simpler version for autocomplete suggestions
  // Just use text search from DB for speed, fallback to AI if no results or low confidence?
  // User asked for "AI HS avanzada". autocomplete might need speed.
  // DB search is fast. GPT-4o is slow (seconds).
  // For autocomplete dropdown, maybe use DB search primarily, and offer "Ask AI" option?
  // Or if "Integra LangChain... campo 'Nombre del Producto' -> autocompletado IA" means
  // when user pauses typing or clicks "Suggest", it defines it.
  
  // We'll implement a function that can be called.
  return classifyProductHS(query);
}
