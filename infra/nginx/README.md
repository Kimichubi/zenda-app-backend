# Deploy na VPS com Nginx

> Agora só existe um `docker-compose.yml`. Não há mais separação entre dev e prod.

## 1. Instalar Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
```

## 2. Verificar se o Nginx está rodando

```bash
sudo systemctl status nginx
```

Acesse `http://IP_DA_VPS` no navegador. Deve aparecer a página padrão do Nginx.

## 3. Configurar o reverse proxy

Copie o arquivo `zenda.conf` para a VPS:

```bash
sudo nano /etc/nginx/sites-available/zenda
```

Cole o conteúdo de `infra/nginx/zenda.conf`. **Altere `server_name` para o seu domínio ou IP**.

Ative o site:

```bash
sudo ln -sf /etc/nginx/sites-available/zenda /etc/nginx/sites-enabled/zenda
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Subir os containers

Na pasta do projeto na VPS:

```bash
cd ~/zenda-app-backend

# Ajuste o .env antes (veja a seção abaixo)
docker compose up -d --build
```

## 5. `.env` na VPS

Certifique-se de que as variáveis estão corretas para o ambiente Docker:

```env
NODE_ENV=production
PORT=3000

# No Docker, use o nome do serviço como host, não localhost
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/postgres?schema=public"
REDIS_URL=redis://redis:6379
WHATSAPP_BASE_URL=http://waha:3001

# CORS — use vírgula para múltiplas origens
FRONTEND_URL=https://app.seudominio.com,https://admin.seudominio.com
```

> **Dica:** `postgres` e `waha` são os nomes dos serviços no `docker-compose.yml`. Dentro dos containers, eles resolvem automaticamente.

## 6. Testar

- API: `http://IP_DA_VPS/` ou `https://seudominio.com/`
- WAHA: `http://IP_DA_VPS:3001/`

## 7. SSL com Certbot (Opcional)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

## Troubleshooting

- **502 Bad Gateway**: Verifique se o container backend está healthy (`docker compose ps`).
- **Erro de CORS / Preflight**: Confira o log do backend (`docker compose logs backend -f`) e ajuste `FRONTEND_URL` no `.env`.
