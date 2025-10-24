import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ArrayNotEmpty, ArrayMaxSize } from 'class-validator';

export class CreatePokemonDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  types?: string[];
}
