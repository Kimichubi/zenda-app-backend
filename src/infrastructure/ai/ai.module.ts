import { Module } from "@nestjs/common";
import { QwenService } from "./qwen.service";
import { GeminiService } from "./gemini.service";

@Module({
  providers: [QwenService, GeminiService],
  exports: [QwenService, GeminiService],
})
export class AiModule {}