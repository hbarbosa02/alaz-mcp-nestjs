import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UserController {
  @Get()
  findAll(): string[] {
    return ['user1', 'user2'];
  }
}
