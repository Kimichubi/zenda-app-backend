# Monitoring Stack

## Grafana + Prometheus

```bash
# Start monitoring stack alongside main services
docker compose -f docker-compose.yml -f infra/monitoring/docker-compose.monitoring.yml up -d

# Or standalone (requires main stack running for network)
docker compose -f infra/monitoring/docker-compose.monitoring.yml up -d
```

### Access
- **Grafana**: http://VPS_IP:3002 (admin / admin)
- **Prometheus**: http://VPS_IP:9090

### Metrics exported
- Backend Node.js (CPU, memory, event loop, GC) at `/metrics`
- PostgreSQL queries, connections, locks
- Host system (CPU, memory, disk, network)

### Import more dashboards
Go to Grafana → Dashboards → Import and use:
- **Node.js**: https://grafana.com/grafana/dashboards/11159
- **PostgreSQL**: https://grafana.com/grafana/dashboards/9628
- **Docker**: https://grafana.com/grafana/dashboards/12227

---

Ver `infra/argocd/README.md` para setup K3s + ArgoCD.
