#!/bin/bash

# Script para configurar variáveis de ambiente na Vercel
echo "🔧 Configurando variáveis de ambiente na Vercel..."

# Adicionar cada variável
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add RESEND_API_KEY production

echo "✅ Variáveis configuradas! Faça um novo deploy para aplicar:"
echo "vercel --prod"