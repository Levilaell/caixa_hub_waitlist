// Script para testar envio de email com Resend
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('📧 Testando envio de email com Resend...\n');

  const resendKey = process.env.RESEND_API_KEY;
  
  if (!resendKey) {
    console.error('❌ Erro: Configure RESEND_API_KEY no arquivo .env.local');
    process.exit(1);
  }

  console.log('🔑 API Key encontrada:', resendKey.substring(0, 10) + '...');

  const resend = new Resend(resendKey);

  // Email de teste
  console.log('\n📮 Enviando email de teste...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'CaixaHub <onboarding@resend.dev>', // Use seu domínio se verificado
      to: 'teste@example.com', // MUDE PARA SEU EMAIL REAL
      subject: 'Teste - CaixaHub Waitlist Funcionando! 🎉',
      html: `
        <h2>Teste de Email Funcionando!</h2>
        <p>Se você está vendo este email, o Resend está configurado corretamente.</p>
        <p>Próximos passos:</p>
        <ul>
          <li>✅ Resend API configurada</li>
          <li>✅ Emails prontos para enviar</li>
          <li>📝 Configure seu domínio para emails personalizados</li>
        </ul>
        <p>Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
      `,
    });

    if (error) {
      console.error('❌ Erro ao enviar:', error);
      
      if (error.message?.includes('domain')) {
        console.log('\n💡 Dica: Use "onboarding@resend.dev" como remetente ou verifique seu domínio');
      }
    } else {
      console.log('✅ Email enviado com sucesso!');
      console.log('📧 ID do email:', data?.id);
      console.log('\n🎉 Resend está funcionando perfeitamente!');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
    
    if (err.message?.includes('API')) {
      console.log('\n💡 Possíveis problemas:');
      console.log('1. API Key inválida - verifique no dashboard do Resend');
      console.log('2. Conta não ativada - confirme seu email no Resend');
      console.log('3. Limite excedido - plano gratuito permite 100 emails/dia');
    }
  }

  console.log('\n📝 Para usar no sistema:');
  console.log('1. O formulário enviará emails automaticamente');
  console.log('2. Para emails do seu domínio, verifique-o no Resend');
  console.log('3. Monitore os envios no dashboard do Resend');
}

// Executar teste
console.log('⚠️  IMPORTANTE: Mude o email de destino no script antes de executar!\n');
testEmail().catch(console.error);