// Script para criar um .env.local de teste
const fs = require('fs');
const path = require('path');

const testEnv = `# Configuração de Teste para CaixaHub Waitlist
# ⚠️ IMPORTANTE: Substitua os valores abaixo com suas credenciais reais

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase - Crie um projeto em supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompanyorprojectname.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo-service-key

# Email (Resend) - Para testes locais, pode usar uma chave fake
RESEND_API_KEY=re_123456789_fake_key_for_testing

# Redis (Upstash) - Para testes locais, pode usar valores fake
UPSTASH_REDIS_REST_URL=https://exemplo.upstash.io
UPSTASH_REDIS_REST_TOKEN=exemplo-token

# Analytics (opcional para desenvolvimento)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_HOTJAR_ID=1234567

# Segurança (opcional para desenvolvimento)
# RECAPTCHA_SITE_KEY=your-site-key
# RECAPTCHA_SECRET_KEY=your-secret-key
# ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
`;

const envPath = path.join(__dirname, '..', '.env.local');

// Verificar se já existe
if (fs.existsSync(envPath)) {
  console.log('⚠️  Arquivo .env.local já existe!');
  console.log('💡 Para criar um novo, delete o existente primeiro.');
} else {
  fs.writeFileSync(envPath, testEnv);
  console.log('✅ Arquivo .env.local criado com sucesso!');
  console.log('\n📝 Próximos passos:');
  console.log('1. Abra o arquivo .env.local');
  console.log('2. Substitua os valores de exemplo pelos seus valores reais do Supabase');
  console.log('3. Execute: npm run test:supabase');
}

console.log('\n🔗 Para obter suas credenciais Supabase:');
console.log('1. Acesse https://app.supabase.com');
console.log('2. Crie um novo projeto (região São Paulo)');
console.log('3. Vá em Settings > API');
console.log('4. Copie:');
console.log('   - Project URL → NEXT_PUBLIC_SUPABASE_URL');
console.log('   - anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - service_role → SUPABASE_SERVICE_ROLE_KEY');