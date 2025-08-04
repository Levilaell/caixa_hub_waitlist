// Script para testar conexão com Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabase() {
  console.log('🔍 Testando conexão com Supabase...\n');

  // Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('📋 Variáveis de ambiente:');
  console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
  console.log('- ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ Não encontrada');
  console.log('- SERVICE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Não encontrada');
  console.log('');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Erro: Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local');
    process.exit(1);
  }

  // Testar conexão com anon key
  console.log('🔌 Testando conexão com Anon Key...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Tentar fazer uma query simples
    const { data, error } = await supabaseAnon
      .from('waitlist')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erro ao conectar com Anon Key:', error.message);
      console.log('\n💡 Possíveis soluções:');
      console.log('1. Verifique se a tabela "waitlist" foi criada');
      console.log('2. Execute a migration SQL no painel do Supabase');
      console.log('3. Verifique se o RLS (Row Level Security) está configurado');
    } else {
      console.log('✅ Conexão com Anon Key funcionando!');
    }
  } catch (err) {
    console.error('❌ Erro de conexão:', err.message);
  }

  // Testar com service key se disponível
  if (supabaseServiceKey) {
    console.log('\n🔌 Testando conexão com Service Role Key...');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      const { count, error } = await supabaseService
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Erro ao conectar com Service Key:', error.message);
      } else {
        console.log('✅ Conexão com Service Role Key funcionando!');
        console.log(`📊 Total de registros na waitlist: ${count || 0}`);
      }

      // Testar estrutura da tabela
      console.log('\n🔍 Verificando estrutura da tabela...');
      const { data: sampleData, error: sampleError } = await supabaseService
        .from('waitlist')
        .select('*')
        .limit(1);

      if (!sampleError && sampleData) {
        const columns = sampleData.length > 0 
          ? Object.keys(sampleData[0]) 
          : 'Tabela vazia - execute uma inserção de teste';
        console.log('📋 Colunas encontradas:', columns);
      }

    } catch (err) {
      console.error('❌ Erro com Service Key:', err.message);
    }
  }

  console.log('\n✅ Teste concluído!');
  console.log('\n📝 Próximos passos:');
  console.log('1. Se a tabela não existe, execute a migration SQL');
  console.log('2. Se tudo está OK, o sistema está pronto para uso');
  console.log('3. Execute "npm run dev" para testar o formulário');
}

// Executar teste
testSupabase().catch(console.error);