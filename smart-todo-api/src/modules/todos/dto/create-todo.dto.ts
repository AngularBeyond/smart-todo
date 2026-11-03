import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Todo text must be at least 1 character long.' })
  @MaxLength(500, { message: 'Todo text cannot exceed 500 characters.' })
  text!: string;
}
