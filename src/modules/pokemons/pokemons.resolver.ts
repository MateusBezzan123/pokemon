import { Resolver, Query, Args, Mutation, Int } from '@nestjs/graphql';
import { PokemonsService } from './pokemons.service';

@Resolver('Pokemon')
export class PokemonsResolver {
    constructor(private readonly service: PokemonsService) { }

    @Query('findManyPokemon')
    async findMany(
        @Args('name', { type: () => String, nullable: true }) name?: string,
        @Args('type', { type: () => String, nullable: true }) type?: string,
        @Args('page', { type: () => Int, nullable: true }) page?: number,
        @Args('pageSize', { type: () => Int, nullable: true }) pageSize?: number,
        @Args('sortBy', { type: () => String, nullable: true }) sortBy?: 'name' | 'created_at',
        @Args('order', { type: () => String, nullable: true }) order?: 'asc' | 'desc',
    ) {
        return this.service.findMany({ name, type, page, pageSize, sortBy, order } as any);
    }

    @Mutation('createOnePokemon')
    createOne(
        @Args('name') name: string,
        @Args('type') type: string,
        @Args('id', { type: () => Int, nullable: true }) id?: number,
    ) {
        return this.service.create({ id, name, types: type ? [type] : undefined });
    }

    @Mutation('updateOnePokemon')
    updateOne(
        @Args('id', { type: () => Int }) id: number,
        @Args('name', { nullable: true }) name?: string,
        @Args('type', { nullable: true }) type?: string,
    ) {
        return this.service.update(id, { name, types: type ? [type] : undefined });
    }

    @Mutation('deleteOnePokemon')
    async deleteOne(@Args('id', { type: () => Int }) id: number) {
        await this.service.delete(id);
        return true;
    }

    @Mutation('importPokemonById')
    importById(@Args('id', { type: () => Int }) id: number) {
        return this.service.importById(id);
    }
}
