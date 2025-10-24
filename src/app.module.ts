import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { HelloModule } from "./modules/hello/hello.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CacheModule } from "@nestjs/cache-manager";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PokemonsModule } from "./modules/pokemons/pokemons.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ["./**/*.graphql"],
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      definitions: {
        path: join(process.cwd(), "src/graphql.ts"),
      },
    }),
    HelloModule,
    PrismaModule,
    // TypeOrmModule.forRoot({
    //   type: "sqlite",
    //   database: "./database/database_orm.sqlite",
    //   autoLoadEntities: true,
    //   synchronize: true,
    //   migrations: ["../typeorm/migrations/*.ts"],
    // }),
    CacheModule.register({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 60 }]),  
    PokemonsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }
