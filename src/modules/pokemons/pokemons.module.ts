import { Module } from '@nestjs/common';
import { PokemonsService } from './pokemons.service';
import { PokemonsController } from './pokemons.controller';
import { PokemonsResolver } from './pokemons.resolver';

@Module({
    controllers: [PokemonsController],
    providers: [PokemonsService, PokemonsResolver],
    exports: [PokemonsService],
})
export class PokemonsModule { }
