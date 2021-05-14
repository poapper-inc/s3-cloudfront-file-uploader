import { CacheModule } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { Test, TestingModule } from "@nestjs/testing"
import { FilesService } from "./files.service"

describe("FilesService", () => {
  let service: FilesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), CacheModule.register({ ttl: 0 })],
      providers: [FilesService, ConfigService],
    }).compile()

    service = module.get<FilesService>(FilesService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })
})
