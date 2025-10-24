import { PartialType } from '@nestjs/mapped-types';
import { CreatePokemonDto } from './create-pokemon.dto';
import { IsInt, Min } from 'class-validator';

export class UpdatePokemonDto extends PartialType(CreatePokemonDto) {
    @IsInt()
    @Min(1)
    id!: number;
}
