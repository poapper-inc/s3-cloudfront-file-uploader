import { CacheModule } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { Test, TestingModule } from "@nestjs/testing"
import { FilesController } from "./files.controller"
import { FilesService } from "./files.service"

describe("FilesController", () => {
  let controller: FilesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), CacheModule.register({ ttl: 0 })],
      providers: [FilesService, ConfigService],
      controllers: [FilesController],
    }).compile()

    controller = module.get<FilesController>(FilesController)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })
})
