import { Controller, Get, Header } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get("metrics")
  @Header("Content-Type", "text/plain")
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
