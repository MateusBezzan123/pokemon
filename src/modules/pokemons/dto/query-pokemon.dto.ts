import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';

export class QueryPokemonDto {
    @IsOptional()
    @IsString()
    name?: string;

    // Mantemos um filtro simples por 1 tipo:
    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @IsPositive()
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @IsPositive()
    @Max(100)
    pageSize?: number = 10;

    @IsOptional()
    @IsIn(['name', 'created_at'])
    sortBy?: 'name' | 'created_at' = 'name';

    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc' = 'asc';
}
