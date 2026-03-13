import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTable() {
    return this.tablesService.createTable();
  }

  @Get('by-code/:code')
  getTableByCode(@Param('code') code: string) {
    return this.tablesService.getTableByCode(code);
  }

  @Get(':tableId')
  getTable(@Param('tableId') tableId: string) {
    return this.tablesService.getTable(tableId);
  }
}
