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

    const systemPrompt = `You are a bill extraction assistant. Given an image of a restaurant receipt or bill, extract all dish/food line items and their prices.

Rules:
- Extract only individual dish or food item names and their prices
- Do NOT include: totals, subtotals, tax, service charges, tips, restaurant name, date, table number, or any other metadata
- Preserve item names as printed, but clean obvious OCR noise (e.g., remove random special characters)
- If a price is missing or unreadable for an item, include the item with price 0 and add a warning
- If the same item appears multiple times, include each occurrence separately
- Detect the currency if possible (default to ILS if unclear)
- Return ONLY valid JSON, no explanation text

Response format:
{
  "items": [
    { "name": "string", "price": number }
  ],
  "currency": "ILS",
  "warnings": []
}`;

    this.logger.log(`Sending image to OpenAI model: ${this.model}`);

    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
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
              text: 'Extract all dish/food items and their prices from this restaurant bill.',
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned empty response');
    }

    this.logger.log('Received response from OpenAI, parsing...');

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
