import { Test } from '@nestjs/testing';
import { PokemonsService } from './pokemons.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PokemonsService', () => {
    let service: PokemonsService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                PokemonsService,
                {
                    provide: PrismaService,
                    useValue: {
                        pokemon: {
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                            findMany: jest.fn(),
                            count: jest.fn(),
                            upsert: jest.fn(),
                        },
                        $transaction: jest.fn((arr: any[]) => Promise.all(arr.map((fn: any) => fn))),
                    },
                },
            ],
        }).compile();

        service = module.get(PokemonsService);
        prisma = module.get(PrismaService);
    });

    it('create deve criar pokemon com types (N:N)', async () => {
        // O service faz include { types: { include: { type: true } } }
        (prisma.pokemon.create as jest.Mock).mockResolvedValue({
            id: 1,
            name: 'bulbasaur',
            created_at: new Date(),
            types: [
                { type: { id: 10, name: 'grass', created_at: new Date() } },
                { type: { id: 11, name: 'poison', created_at: new Date() } },
            ],
        });

        const res = await service.create({ name: 'bulbasaur', types: ['grass', 'poison'] });
        expect(res.id).toBe(1);
        expect(res.types).toHaveLength(2);
        expect(res.types[0].type.name).toBe('grass');
    });

    it('findMany deve paginar e trazer types', async () => {
        (prisma.$transaction as jest.Mock).mockResolvedValue([
            [
                {
                    id: 1,
                    name: 'a',
                    created_at: new Date(),
                    types: [{ type: { id: 99, name: 'x', created_at: new Date() } }],
                },
            ],
            1,
        ]);

        const res = await service.findMany({ page: 1, pageSize: 10 } as any);
        expect(res.total).toBe(1);
        expect(res.items).toHaveLength(1);
        expect(res.items[0].types[0].type.name).toBe('x');
    });
});
