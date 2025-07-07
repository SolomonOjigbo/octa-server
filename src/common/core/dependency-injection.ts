// src/core/dependency-injection.ts
import { PrismaClient } from "@prisma/client";
import { CacheService } from "@cache/cache.service";
import { AuditService } from "@modules/audit/types/audit.service";
import { EventEmitter } from "@events/event.emitter";
import { StockService } from "@modules/stock/services/stock.service";

export class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();

  private constructor() {
    // Register core services
    this.services.set("prisma", new PrismaClient());
    this.services.set("cache", new CacheService());
    this.services.set("audit", new AuditService());
    this.services.set("events", EventEmitter.getInstance());
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  resolve<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service;
  }
}

// Initialize container with services
export const container = Container.getInstance();
container.register("stockService", new StockService());