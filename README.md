# Candidate Interview Project

## Overview

This repository contains a **NestJS** backend exposing both **REST** and **GraphQL** APIs for a simple Pokémon catalog.  
I implemented the required CRUD plus several bonus items (pagination, filtering, sorting, rate limiting, caching, validation, tests, and a PokeAPI import).  
Additionally, I refactored the data model to use a **many-to-many** relationship between Pokémon and Types.

---

## What I Implemented

### 1) Data model (Prisma)
- Switched from a single `type: String` column to a **many-to-many** design:
  - `Pokemon` (id, name, created_at)
  - `Type` (id, name unique, created_at)
  - `PokemonType` (join table `pokemon_types`)
- CRUD now writes/reads types via the relation.  
- When creating/updating, the API accepts `types: string[]` (e.g., `["grass","poison"]`).  
  Types are created on the fly using `connectOrCreate`.

### 2) REST Endpoints
- `POST /pokemons` – create a Pokémon (supports optional fixed `id` and `types: string[]`)
- `PATCH /pokemons/:id` – update name and/or replace types
- `DELETE /pokemons/:id` – delete (handles relations)
- `GET /pokemons` – list with **filters** (`name` contains, `type` equals), **pagination** (`page`, `pageSize`), and **sorting** (`sortBy=name|created_at`, `order=asc|desc`)
- `POST /pokemons/import/:id` – import/update from **PokeAPI** (e.g., `/pokemons/import/158`)

### 3) GraphQL
- A GraphQL schema and resolver mirror the functionality.  
- For backward compatibility, the resolver can map a single `type` argument to `types: [type]`.

### 4) Validation & Error Handling
- **class-validator** on DTOs: string sizes, allowed values, positive ints, etc.
- Centralized NotFound handling for Prisma (`P2025`).
- Global `ValidationPipe({ transform: true, whitelist: true })` to coerce query strings (e.g., `page`, `pageSize` → numbers).

### 5) Pagination, Filtering, Sorting
- Implemented at the Prisma query level (with transactional count).
- Name filter uses `contains`. Type filter matches the relation (`pokemon_types → type.name`).

### 6) Rate Limiting & Caching
- **@nestjs/throttler** configured globally (60 requests / 60s by default).
- A custom guard handles both **HTTP** and **GraphQL** contexts (avoids `req.ip` undefined in GQL).
- **@nestjs/cache-manager** is enabled globally (you can easily add per-route caching decorators later).

### 7) Tests
- Unit tests for the Pokémon service (mocks Prisma client).
- Integration test for the Hello module (GraphQL `/graphql`).

---

## Installation

```bash
# Node 18+ recommended
pnpm install
# or
npm install
# or
yarn
```

### Prisma (generate client)
```bash
pnpm prisma generate
# or
npm run prisma generate
# or
yarn prisma generate
```

---

## Database Setup (Prisma, SQLite)

This project ships with a SQLite database for Prisma at `./database/database_prisma.sqlite`.

After switching to many-to-many, you must bring the DB in sync:

```bash
# Dev-friendly reset (wipes data) and pushes current schema:
pnpm prisma db push --force-reset
# or:
pnpm prisma db push
```

> Alternatively, create a migration:
> ```bash
> pnpm prisma migrate dev --name n_n_types
> ```

### Cascade deletes (optional but recommended)
Relations in `PokemonType` are configured with `onDelete: Cascade`, so deleting a Pokémon also deletes its join rows. If you change the schema, re-run `db push`/`migrate`.

---

## Running the App

```bash
pnpm start:dev
# or
npm run start:dev
# or
yarn start:dev
```

Base URL (REST): `http://localhost:4000`  
GraphQL Playground: `http://localhost:4000/graphql`

---

## Postman Collection

A collection/environment are included to test endpoints quickly:

- **Collection**: `PokemonsAPI.NxN.postman_collection.json`
- **Environment**: `PokemonsAPI.local_environment.json`

They contain all CRUD requests, list with filters/pagination/sorting, and the PokeAPI import.

---

## Example Requests (REST)

**Create**
```http
POST /pokemons
Content-Type: application/json

{
  "name": "bulbasaur",
  "types": ["grass", "poison"]
}
```

**Update**
```http
PATCH /pokemons/1
Content-Type: application/json

{
  "name": "ivysaur",
  "types": ["grass", "poison"]
}
```

**List**
```
GET /pokemons?name=saur&type=grass&page=1&pageSize=5&sortBy=name&order=asc
```

**Import from PokeAPI**
```
POST /pokemons/import/158
```

---

## GraphQL Snippets

**Query**
```graphql
query FindMany {
  findManyPokemon(name: "saur", type: "grass", page: 1, pageSize: 5, sortBy: "name", order: "asc") {
    items { id name created_at types { type { id name } } }
    page pageSize total totalPages sortBy order
  }
}
```

**Mutations**
```graphql
mutation Create {
  createOnePokemon(name: "bulbasaur", type: "grass") { id name }
}

mutation Update {
  updateOnePokemon(id: 1, name: "ivysaur", type: "poison") { id name }
}

mutation Import {
  importPokemonById(id: 158) { id name types { type { name } } }
}
```

> The resolver maps `type` → `types: [type]`. You can switch the schema to accept `types: [String!]` to reflect the N:N more explicitly.

---

## Optional TypeORM Toggle

The repo has both Prisma and TypeORM wired, but Prisma is used for CRUD. If you keep TypeORM enabled, install a driver:

```bash
pnpm add sqlite3
# or a faster alternative on Windows:
pnpm add better-sqlite3
```

Or simply **disable TypeORM** in `AppModule` (comment out the `TypeOrmModule.forRoot` block).

---

## Troubleshooting

- **`Null constraint violation on fields: (type)`**  
  Your SQLite still has an old `type` column. Run:
  ```bash
  pnpm prisma db push --force-reset
  ```
- **Delete fails due to relations**  
  Either delete join rows first (`pokemonType.deleteMany`) or use `onDelete: Cascade` and re-push the schema.
- **Prisma validation: `take`/`skip` expects numbers**  
  Ensure `ValidationPipe({ transform: true })` is enabled (it is) and the service coerces `page/pageSize` to numbers.
- **Throttler error: `Cannot read properties of undefined (reading 'ip')`**  
  Use the custom `GqlOrHttpThrottlerGuard` (included) so rate limiting works in both HTTP and GraphQL.

---

## Scripts

```bash
# dev
pnpm start:dev

# prisma
pnpm prisma generate
pnpm prisma db push
pnpm prisma db push --force-reset
pnpm prisma migrate dev --name <name>

# tests
pnpm test
```

---

## Notes on Design

- **Prisma** chosen as the primary ORM for speed and type safety; TypeORM kept optional.
- **N:N types** better models real Pokémon typings and showcases relational queries.
- **Validation & Guards** demonstrate input hygiene and basic protection (rate limiting).
- **Import** shows integration with an external API and upsert logic.
