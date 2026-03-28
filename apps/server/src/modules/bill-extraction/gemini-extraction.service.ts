import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { ExtractionResult, ExtractionResultSchema } from '@bill/shared';

@Injectable()
export class GeminiExtractionService {
  private readonly logger = new Logger(GeminiExtractionService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    });
    this.model = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
  }

  async extractBillItems(imageBuffer: Buffer, mimeType: string): Promise<ExtractionResult> {
    const base64Image = imageBuffer.toString('base64');

    const systemPrompt = `You are a bill extraction assistant. Given an image of a restaurant receipt or bill, your job is two steps:

STEP 1 — IMAGE ENHANCEMENT (do this mentally before extracting):
The image may be blurry, low-contrast, poorly lit, or at an angle. Before extracting anything:
- Mentally enhance the image: boost contrast, sharpen text edges, correct skew
- Re-read any characters that look ambiguous (e.g., 0 vs O, 1 vs l, 5 vs S) using context clues from surrounding text
- Use the overall structure of the receipt (columns, alignment, repeating patterns) to resolve unclear regions

STEP 2 — EXTRACT (only after enhancing):
Extract ONLY the dish/food line items that are EXPLICITLY VISIBLE in the image.

CRITICAL — NEVER HALLUCINATE:
- ONLY extract items you can actually read in the image. Do NOT guess, infer, or invent any item names or prices.
- If an item name is unclear or unreadable, use the name "לא נקרא" (do not guess what it might say).
- If a price is unclear or unreadable, use 0 and add a warning.
- It is better to return fewer items than to invent items that may not be there.
- take into account that some items might be indented on the bill.

Rules:
- Extract only individual dish or food item names and their prices
- Do NOT include: totals, subtotals, tax, service charges, tips, restaurant name, date, table number, or any other metadata
- Preserve item names exactly as printed, but clean obvious OCR noise (e.g., remove random special characters)
- If the same item appears multiple times, include each occurrence separately
- Detect the currency if possible (default to ILS if unclear)
- Classify each item into exactly one category: "starter", "main", "dessert", "drink", or "other"
  - "starter": appetizers, soups, salads, bread, dips served before the main course
  - "main": main dishes, entrees, burgers, pasta, pizza, grills, sandwiches
  - "dessert": sweets, cakes, ice cream, pastries served after the main course
  - "drink": any beverage — water, juice, soda, alcohol, coffee, tea
  - "other": anything that does not clearly fit the above categories
- Return ONLY valid JSON, no explanation text

Response format:
{
  "items": [
    { "name": "string", "price": number, "category": "starter" | "main" | "dessert" | "drink" | "other" }
  ],
  "currency": "ILS",
  "warnings": []
}`;

    this.logger.log(`Sending image to Gemini model: ${this.model}`);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              text: 'Extract ONLY the dish/food items and prices that are explicitly visible and readable in this bill. Do not invent or guess any items.',
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object' as const,
          properties: {
            items: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: {
                  name: { type: 'string' as const },
                  price: { type: 'number' as const },
                  category: {
                    type: 'string' as const,
                    enum: ['starter', 'main', 'dessert', 'drink', 'other'],
                  },
                },
                required: ['name', 'price', 'category'],
              },
            },
            currency: { type: 'string' as const },
            warnings: { type: 'array' as const, items: { type: 'string' as const } },
          },
          required: ['items', 'currency', 'warnings'],
        },
        temperature: 0,
        maxOutputTokens: 4000,
      },
    });

    const rawContent = response.text;
    if (!rawContent) {
      throw new Error('Gemini returned empty response');
    }

    this.logger.log(`Received response from Gemini: ${rawContent.slice(0, 300)}`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      this.logger.error('Failed to parse Gemini JSON response', rawContent);
      throw new Error('Gemini returned invalid JSON');
    }

    const validated = ExtractionResultSchema.safeParse(parsed);
    if (!validated.success) {
      this.logger.error(
        'Gemini response failed schema validation',
        JSON.stringify(validated.error.issues),
      );
      throw new Error('Gemini response did not match expected schema');
    }

    return validated.data;
  }
}
