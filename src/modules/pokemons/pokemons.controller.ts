import { UseInterceptors, Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { PokemonsService } from './pokemons.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { QueryPokemonDto } from './dto/query-pokemon.dto';

@Controller('pokemons')
@UseInterceptors(CacheInterceptor)
export class PokemonsController {
    constructor(private readonly service: PokemonsService) { }

    @Post()
    @Throttle({ default: { limit: 10, ttl: 60 } })
    async create(@Body() dto: CreatePokemonDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    @Throttle({ default: { limit: 20, ttl: 60 } })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: Omit<UpdatePokemonDto, 'id'>,
    ) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @Throttle({ default: { limit: 20, ttl: 60 } })
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.service.delete(id);
    }

    @Get()
    @CacheTTL(10)
    async findMany(@Query() q: QueryPokemonDto) {
        return this.service.findMany(q);
    }

    @Post('import/:id')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    async import(@Param('id', ParseIntPipe) id: number) {
        return this.service.importById(id);
    }
}
