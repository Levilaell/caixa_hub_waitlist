# Configuração DNS para waitlist.caixahub.com.br

## Registro DNS necessário no Cloudflare:

### CNAME Record
- **Type**: CNAME
- **Name**: waitlist
- **Content**: cname.vercel-dns.com
- **Proxy status**: DNS only (nuvem cinza - IMPORTANTE!)
- **TTL**: Auto

## Importante:
- O Proxy deve estar DESATIVADO (nuvem cinza) para funcionar com a Vercel
- A propagação DNS pode levar até 48h, mas geralmente é rápida (5-30 min)

## Verificar propagação:
Após adicionar o registro, você pode verificar se está funcionando:

```bash
# No terminal
nslookup waitlist.caixahub.com.br

# Ou use um site como
# https://www.whatsmydns.net/
```

## Após configurar o DNS:
1. Aguarde alguns minutos para propagação
2. A Vercel detectará automaticamente e emitirá o certificado SSL
3. O site estará disponível em https://waitlist.caixahub.com.br