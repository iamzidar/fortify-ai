# Kubernetes Secrets

Never commit actual secret values. Create secrets manually on the server:

```bash
kubectl create secret generic fortify-secrets \
  --namespace fortify \
  --from-literal=JWT_SECRET=$(openssl rand -hex 32) \
  --from-literal=INTERNAL_SERVICE_SECRET=$(openssl rand -hex 32) \
  --from-literal=ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE \
  --from-literal=POSTGRES_PASSWORD=$(openssl rand -hex 16) \
  --from-literal=REDIS_PASSWORD=$(openssl rand -hex 16)

# GHCR pull secret (replace with your GitHub token)
kubectl create secret docker-registry ghcr-secret \
  --namespace fortify \
  --docker-server=ghcr.io \
  --docker-username=iamzidar \
  --docker-password=YOUR_GITHUB_PAT \
  --docker-email=kikoichia@gmail.com
```
