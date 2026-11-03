import { IsNumber } from 'class-validator';

export class ReorderTodoDto {
  @IsNumber({}, { message: 'Order must be a valid number.' })
  order!: number;
}
