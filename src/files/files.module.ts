import { CacheModule, Module } from "@nestjs/common"
import { FilesService } from "./files.service"
import { FilesController } from "./files.controller"
import { ConfigModule } from "@nestjs/config"

@Module({
  imports: [ConfigModule, CacheModule.register({ ttl: 0 })],
  providers: [FilesService],
  controllers: [FilesController],
})
export class FilesModule {}
