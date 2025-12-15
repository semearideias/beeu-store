import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configurar transporte de email
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  console.warn('⚠️ Email não configurado. Defina SMTP_USER e SMTP_PASS no .env');
}

export async function sendQuoteUpdatedEmail(quote, customer, company) {
  try {
    if (!transporter) {
      console.log('Email não configurado. Pulando envio.');
      return;
    }

    if (!customer || !customer.email) {
      console.log('Email do cliente não disponível');
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: customer.email,
      subject: `Orçamento ${quote.quote_number} foi atualizado`,
      html: `
        <h2>Olá ${customer.contact_name || customer.name},</h2>
        
        <p>O seu orçamento <strong>#${quote.quote_number}</strong> foi atualizado.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Resumo do Orçamento:</h3>
          <p><strong>Subtotal:</strong> €${parseFloat(quote.subtotal).toFixed(2)}</p>
          <p><strong>IVA (23%):</strong> €${parseFloat(quote.tax).toFixed(2)}</p>
          ${quote.shipping_cost ? `<p><strong>Envio:</strong> €${parseFloat(quote.shipping_cost).toFixed(2)}</p>` : ''}
          <p style="font-size: 18px; font-weight: bold; color: #0066cc;">
            <strong>Total:</strong> €${parseFloat(quote.total).toFixed(2)}
          </p>
        </div>
        
        <p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/quotes/${quote.id}" 
             style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
            Ver Orçamento Completo
          </a>
        </p>
        
        <p>Se tiver dúvidas, contacte-nos em ${company?.company_email || 'contato@empresa.com'}</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666;">
          ${company?.company_name || 'Empresa'} | ${company?.company_phone || ''}
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email enviado para ${customer.email}`);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
  }
}

export async function sendQuoteCreatedEmail(quote, customer, company) {
  try {
    if (!transporter) {
      console.log('Email não configurado. Pulando envio.');
      return;
    }

    if (!customer || !customer.email) {
      console.log('Email do cliente não disponível');
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: customer.email,
      subject: `Novo Orçamento #${quote.quote_number}`,
      html: `
        <h2>Olá ${customer.contact_name || customer.name},</h2>
        
        <p>Recebemos o seu pedido de orçamento e já o processámos.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Dados do Orçamento:</h3>
          <p><strong>Número:</strong> #${quote.quote_number}</p>
          <p><strong>Data:</strong> ${new Date(quote.created_at).toLocaleDateString('pt-PT')}</p>
          <p><strong>Total:</strong> €${parseFloat(quote.total).toFixed(2)}</p>
        </div>
        
        <p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/quotes/${quote.id}" 
             style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
            Ver Orçamento
          </a>
        </p>
        
        <p>Agradecemos o seu interesse!</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666;">
          ${company?.company_name || 'Empresa'} | ${company?.company_phone || ''}
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email enviado para ${customer.email}`);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
  }
}

export async function sendOrderShippedEmail(order, trackingInfo, company) {
  try {
    if (!transporter) {
      console.log('Email não configurado. Pulando envio.');
      return;
    }

    if (!order.email) {
      console.log('Email do cliente não disponível');
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: order.email,
      subject: `Seu pedido ${order.order_number} foi enviado!`,
      html: `
        <h2>Olá ${order.contact_name || order.company_name},</h2>
        
        <p>Boas notícias! O seu pedido foi enviado.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Informações de Rastreamento:</h3>
          <p><strong>Número do Pedido:</strong> ${order.order_number}</p>
          <p><strong>Transportadora:</strong> ${trackingInfo.carrier || 'A definir'}</p>
          ${trackingInfo.tracking_number ? `<p><strong>Número de Rastreamento:</strong> ${trackingInfo.tracking_number}</p>` : ''}
          ${trackingInfo.tracking_url ? `
            <p>
              <a href="${trackingInfo.tracking_url}" 
                 style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
                Rastrear Pedido
              </a>
            </p>
          ` : ''}
        </div>
        
        <p>Se tiver dúvidas, contacte-nos em ${company?.company_email || 'contato@empresa.com'}</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666;">
          ${company?.company_name || 'Empresa'} | ${company?.company_phone || ''}
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de rastreamento enviado para ${order.email}`);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
  }
}

export default {
  sendQuoteUpdatedEmail,
  sendQuoteCreatedEmail,
  sendOrderShippedEmail
};
