import { IsNotEmpty, IsNumber } from 'class-validator';

export class ReorderTodoListDto {
  @IsNotEmpty()
  @IsNumber()
  order!: number;
}
