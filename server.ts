import express from 'express';
import { Resend } from 'resend';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Initialize Resend
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn("RESEND_API_KEY is missing. Email functionality will be disabled.");
}

app.use(express.json());

// Email Template Function
const generateEmailHtml = (order: any, isForAdmin: boolean) => {
  const { id, items, total_amount, shipping_address, payment_details, created_at } = order;
  const logoUrl = "https://esenconcept.netlify.app/logo.png";
  
  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 4px;">
          <div>
            <div style="font-weight: bold;">${item.name}</div>
            <div style="font-size: 12px; color: #666;">${item.color} / ${item.size}</div>
          </div>
        </div>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-height: 50px; }
        .order-details { margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-admin { background: #e0e7ff; color: #4338ca; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="ESEN CONCEPT" class="logo">
          ${isForAdmin ? '<br><br><span class="badge badge-admin">NUEVA ORDEN RECIBIDA</span>' : ''}
          <h1>${isForAdmin ? 'Nueva Venta Realizada' : '¡Gracias por tu compra!'}</h1>
          <p>Orden #${id.slice(0, 8)}</p>
        </div>

        <div class="order-details">
          <h3>Detalles del Pedido</h3>
          <p><strong>Fecha:</strong> ${new Date(created_at).toLocaleDateString()}</p>
          <p><strong>Estado:</strong> ${order.status || 'Pendiente'}</p>
          <p><strong>Método de Pago:</strong> ${payment_details?.method === 'zelle' ? 'Zelle' : 'Tarjeta de Crédito'}</p>
          
          <h4>Dirección de Envío</h4>
          <p>
            ${shipping_address.firstName} ${shipping_address.lastName}<br>
            ${shipping_address.address}<br>
            ${shipping_address.city}, ${shipping_address.state} ${shipping_address.zipCode}<br>
            ${shipping_address.country}<br>
            Tel: ${shipping_address.phone}
          </p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #eee;">Producto</th>
              <th style="text-align: center; padding: 10px; border-bottom: 2px solid #eee;">Cant.</th>
              <th style="text-align: right; padding: 10px; border-bottom: 2px solid #eee;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total">
          Total: $${total_amount.toFixed(2)}
        </div>

        <div class="footer">
          <p>ESEN CONCEPT</p>
          <p>Si tienes alguna pregunta, contáctanos a soporte@esenconcept.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// API Endpoint to send emails
app.post('/api/send-email', async (req, res) => {
  try {
    const { order, userEmail } = req.body;

    if (!order || !userEmail) {
      return res.status(400).json({ error: 'Missing order or userEmail' });
    }

    if (!resend) {
      console.warn("Attempted to send email but RESEND_API_KEY is not configured.");
      return res.status(503).json({ error: 'Email service not configured (missing API key).' });
    }

    // 1. Send email to Customer
    const customerEmailHtml = generateEmailHtml(order, false);
    const customerData = await resend.emails.send({
      from: 'ESEN CONCEPT <onboarding@resend.dev>', // Use verified domain in production
      to: [userEmail],
      subject: `Confirmación de Orden #${order.id.slice(0, 8)} - ESEN CONCEPT`,
      html: customerEmailHtml,
    });

    // 2. Send email to Admin
    // In a real scenario, this would be the admin's email. 
    // For now, we'll send it to the same user email or a hardcoded one if provided.
    // Assuming the user wants to receive the admin notification as well for testing.
    // Or we can use a specific admin email if known. 
    // Let's send it to the same email for now but with a different subject/header.
    const adminEmailHtml = generateEmailHtml(order, true);
    const adminData = await resend.emails.send({
      from: 'ESEN CONCEPT <onboarding@resend.dev>',
      to: [userEmail], // TODO: Change to actual admin email (e.g., 'admin@esenconcept.com')
      subject: `[ADMIN] Nueva Venta - Orden #${order.id.slice(0, 8)}`,
      html: adminEmailHtml,
    });

    res.json({ success: true, customer: customerData, admin: adminData });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error });
  }
});

// Serve API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving would go here if we were building for prod
    // For this environment, we might just rely on Vite dev server or similar
    // But typically:
    // app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
