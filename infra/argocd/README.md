# ArgoCD + K3s (GitOps)

## Requisitos
- VPS com Docker suportado (K3s substitui Docker)
- Domínio ou IP público
- GitHub repo com os manifests

## Instalação rápida

```bash
# 1. SSH no VPS
ssh root@seu-vps

# 2. Instala K3s + ArgoCD + aplica manifests
bash <(curl -fsSL https://raw.githubusercontent.com/kimichubi/zenda-app-backend/main/infra/argocd/setup.sh)

# 3. Cria secrets (substitua os valores)
kubectl create secret generic zenda-backend-secrets -n zenda \
  --from-literal=JWT_ACCESS_SECRET='openssl rand -hex 64' \
  --from-literal=JWT_REFRESH_SECRET='openssl rand -hex 64' \
  --from-literal=GEMINAI_API_KEY='sua-key' \
  --from-literal=OPENROUTER_API_KEY='sua-key'

kubectl create secret generic zenda-postgres -n zenda \
  --from-literal=url='postgresql://user:pass@postgres:5432/zenda-prod?schema=public'

kubectl create secret generic zenda-redis -n zenda \
  --from-literal=url='redis://redis:6379'

kubectl create secret docker-registry ghcr-secret -n zenda \
  --docker-server=ghcr.io \
  --docker-username=kimichubi \
  --docker-password='seu-github-token'
```

## Fluxo GitOps

```
            push main
 Developer ──────────► GitHub
                         │
                    (ArgoCD syncs)
                         ▼
                    K3s cluster
                    ┌──────────┐
                    │ ArgoCD   │◄──── auto-prune
                    │          │      auto-heal
                    │ zenda    │
                    │ backend  │
                    │ postgres │
                    │ redis    │
                    │ waha     │
                    └──────────┘
```

## Dependências (PostgreSQL, Redis, WAHA)

O ArgoCD Application atual cobre **apenas o backend**. Para as dependências, crie manifests similares em `infra/argocd/kustomize/` ou use Helm charts:

```bash
# PostgreSQL via Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql -n zenda

# Redis via Helm
helm install redis bitnami/redis -n zenda
```

Para WAHA, crie um Deployment similar ao backend ou mantenha em Docker externo.
