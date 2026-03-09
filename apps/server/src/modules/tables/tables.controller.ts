import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableRequestSchema } from './dto/create-table.dto';
import { BadRequestException } from '@nestjs/common';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTable(@Body() body: unknown) {
    const result = CreateTableRequestSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: result.error.issues.map((i) => i.message).join(', '),
      });
    }
    return this.tablesService.createTable(result.data.groupName);
  }

  @Get(':tableId')
  getTable(@Param('tableId') tableId: string) {
    return this.tablesService.getTable(tableId);
  }
}
