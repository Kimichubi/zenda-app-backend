import { Injectable, OnModuleInit } from "@nestjs/common";
import * as promClient from "prom-client";

@Injectable()
export class MetricsService implements OnModuleInit {
  private registry: promClient.Registry;

  onModuleInit() {
    this.registry = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
