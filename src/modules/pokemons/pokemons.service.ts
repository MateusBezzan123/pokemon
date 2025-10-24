import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { QueryPokemonDto } from './dto/query-pokemon.dto';
import axios from 'axios';

@Injectable()
export class PokemonsService {
    constructor(private readonly prisma: PrismaService) { }

    private mapTypesToNestedCreate(typeNames?: string[]) {
        const names = (typeNames ?? []).map(s => s.trim().toLowerCase()).filter(Boolean);
        if (!names.length) return undefined;

        return {
            create: names.map((nm) => ({
                type: {
                    connectOrCreate: {
                        where: { name: nm },
                        create: { name: nm },
                    },
                },
            })),
        };
    }

    async create(data: CreatePokemonDto) {
        const { id, name, types } = data;
        const nestedTypes = this.mapTypesToNestedCreate(types);

        if (id) {
            return this.prisma.pokemon.upsert({
                where: { id },
                update: {
                    name,
                    ...(nestedTypes && {
                        types: { deleteMany: {}, ...nestedTypes },
                    }),
                },
                create: {
                    id,
                    name,
                    ...(nestedTypes && { types: nestedTypes }),
                },
                include: { types: { include: { type: true } } },
            });
        }

        return this.prisma.pokemon.create({
            data: {
                name,
                ...(nestedTypes && { types: nestedTypes }),
            },
            include: { types: { include: { type: true } } },
        });
    }

    async update(id: number, data: Omit<UpdatePokemonDto, 'id'>) {
        const { name, types } = data;
        const nestedTypes = this.mapTypesToNestedCreate(types);

        try {
            return await this.prisma.pokemon.update({
                where: { id },
                data: {
                    ...(name !== undefined ? { name } : {}),
                    ...(nestedTypes
                        ? { types: { deleteMany: {}, ...nestedTypes } } // sobrescreve os tipos
                        : {}),
                },
                include: { types: { include: { type: true } } },
            });
        } catch (e) {
            if (this._isNotFound(e)) throw new NotFoundException(`Pokemon ${id} não encontrado`);
            throw e;
        }
    }

    async delete(id: number) {
        try {
            // apaga links N:N primeiro
            await this.prisma.pokemonType.deleteMany({ where: { pokemonId: id } });

            // agora pode apagar o pokemon
            await this.prisma.pokemon.delete({ where: { id } });
            return { ok: true };
        } catch (e) {
            if (this._isNotFound(e)) throw new NotFoundException(`Pokemon ${id} não encontrado`);
            throw e;
        }
    }


    async findMany(q: QueryPokemonDto) {
        let { page = 1, pageSize = 10, name, type, sortBy = 'name', order = 'asc' } = q;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;
        if (pageSize > 100) pageSize = 100;
        if (page < 1) page = 1;

        const where: Prisma.PokemonWhereInput = {
            AND: [
                name ? { name: { contains: name } } : undefined,
                type ? {
                    types: { some: { type: { name: { equals: type.toLowerCase() } } } }
                } : undefined,
            ].filter(Boolean) as Prisma.PokemonWhereInput[],
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.pokemon.findMany({
                where,
                orderBy: { [sortBy]: order },
                take: pageSize,
                skip: (page - 1) * pageSize,
                include: { types: { include: { type: true } } },
            }),
            this.prisma.pokemon.count({ where }),
        ]);

        return {
            items, page, pageSize,
            total, totalPages: Math.ceil(total / pageSize),
            sortBy, order, filters: { name, type },
        };
    }



    async importById(id: number) {
        const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
        const { data } = await axios.get(url);

        const name: string = data.name;
        const typeNames: string[] =
            Array.isArray(data.types) && data.types.length
                ? data.types
                    .map((t: any) => t?.type?.name)
                    .filter(Boolean)
                    .map((s: string) => s.toLowerCase())
                : ['unknown'];

        const nestedTypes = this.mapTypesToNestedCreate(typeNames);

        return this.prisma.pokemon.upsert({
            where: { id },
            update: { name, types: { deleteMany: {}, ...(nestedTypes ?? {}) } },
            create: { id, name, ...(nestedTypes && { types: nestedTypes }) },
            include: { types: { include: { type: true } } },
        });
    }

    private _isNotFound(e: any) {
        return e?.code === 'P2025';
    }
}
