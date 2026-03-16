import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OpenAIExtractionResult, OpenAIExtractionResultSchema } from '@bill/shared';

@Injectable()
export class OpenAIExtractionService {
  private readonly logger = new Logger(OpenAIExtractionService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o');
  }

  async extractBillItems(imageBuffer: Buffer, mimeType: string): Promise<OpenAIExtractionResult> {
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const systemPrompt = `You are a bill extraction assistant. Given an image of a restaurant receipt or bill, extract ONLY the dish/food line items that are EXPLICITLY VISIBLE in the image.

CRITICAL — NEVER HALLUCINATE:
- ONLY extract items you can actually read in the image. Do NOT guess, infer, or invent any item names or prices.
- If an item name is unclear or unreadable, use the name "לא נקרא" (do not guess what it might say).
- If a price is unclear or unreadable, use 0 and add a warning.
- It is better to return fewer items than to invent items that may not be there.

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

    this.logger.log(`Sending image to OpenAI model: ${this.model}`);

    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'bill_extraction',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    price: { type: 'number' },
                    category: {
                      type: 'string',
                      enum: ['starter', 'main', 'dessert', 'drink', 'other'],
                    },
                  },
                  required: ['name', 'price', 'category'],
                  additionalProperties: false,
                },
              },
              currency: { type: 'string' },
              warnings: { type: 'array', items: { type: 'string' } },
            },
            required: ['items', 'currency', 'warnings'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: 'Extract ONLY the dish/food items and prices that are explicitly visible and readable in this bill. Do not invent or guess any items.',
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned empty response');
    }

    this.logger.log(`Received response from OpenAI: ${rawContent.slice(0, 300)}`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      this.logger.error('Failed to parse OpenAI JSON response', rawContent);
      throw new Error('OpenAI returned invalid JSON');
    }

    const validated = OpenAIExtractionResultSchema.safeParse(parsed);
    if (!validated.success) {
      this.logger.error(
        'OpenAI response failed schema validation',
        JSON.stringify(validated.error.issues),
      );
      throw new Error('OpenAI response did not match expected schema');
    }

    return validated.data;
  }
}
