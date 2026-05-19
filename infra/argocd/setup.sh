#!/bin/bash
# Zenda - K3s + ArgoCD setup on VPS
# Usage: curl -fsSL https://raw.githubusercontent.com/kimichubi/.../setup.sh | bash

set -euo pipefail

echo "=== Installing K3s ==="
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
mkdir -p ~/.kube
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config

echo "=== Installing ArgoCD ==="
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "=== Wait for ArgoCD ==="
kubectl wait --for=condition=available --timeout=120s -n argocd deployment/argocd-server

echo "=== Expose ArgoCD via NodePort ==="
kubectl patch svc argocd-server -n argocd -p '{"spec":{"type":"NodePort"}}'

ARGOCD_PORT=$(kubectl get svc argocd-server -n argocd -o jsonpath='{.spec.ports[0].nodePort}')
ARGOCD_PASSWORD=$(kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d)

echo ""
echo "=== ArgoCD ready ==="
echo "  URL:     https://$(curl -s ifconfig.me):$ARGOCD_PORT"
echo "  User:    admin"
echo "  Pass:    $ARGOCD_PASSWORD"
echo ""

echo "=== Create namespace + secrets ==="
kubectl create namespace zenda --dry-run=client -o yaml | kubectl apply -f -

# Template: create these secrets manually with real values
cat <<SECEOF
Create these secrets manually:
  kubectl create secret generic zenda-backend-secrets -n zenda \\
    --from-literal=JWT_ACCESS_SECRET='<value>' \\
    --from-literal=JWT_REFRESH_SECRET='<value>' \\
    --from-literal=GEMINAI_API_KEY='<value>' \\
    --from-literal=OPENROUTER_API_KEY='<value>'

  kubectl create secret generic zenda-postgres -n zenda \\
    --from-literal=url='postgresql://user:pass@postgres:5432/zenda-prod?schema=public'

  kubectl create secret generic zenda-redis -n zenda \\
    --from-literal=url='redis://redis:6379'

  kubectl create secret docker-registry ghcr-secret -n zenda \\
    --docker-server=ghcr.io \\
    --docker-username=<github-user> \\
    --docker-password=<github-token>
SECEOF

echo ""
echo "=== Apply ArgoCD manifests ==="
kubectl apply -f infra/argocd/project.yml
kubectl apply -f infra/argocd/application.yml

echo "=== Done! ==="
