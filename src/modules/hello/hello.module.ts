import { Module } from "@nestjs/common";
import { HelloService } from "./hello.service";
import { HelloResolver } from "./hello.resolver";
import { HelloController } from "./hello.controller";

@Module({
  controllers: [HelloController],
  providers: [HelloResolver, HelloService],
})
export class HelloModule {}
