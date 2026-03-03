import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend("re_HHts1TDD_E7yzCzkQDJFTibnQTEmFdjdK");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  salePrice?: number;
  isSale?: boolean;
  selectedColor?: string;
  selectedSize?: string;
  image?: string;
}

interface Order {
  id: string;
  total: number; // Changed from total_amount to match frontend
  items: OrderItem[];
  shippingAddress: string; // Changed from shipping_address
  paymentMethod: string; // Changed from payment_method
  status: string;
  isGift?: boolean; // Changed from is_gift
  giftDetails?: { // Changed from gift_details
    recipientName: string;
    recipientEmail: string;
    message: string;
  };
  paymentDetails?: { // Changed from payment_details
    referenceNumber: string;
    bank: string;
  };
  user_email: string;
  user_name: string;
}

const generateEmailHtml = (order: Order, isCustomer: boolean) => {
  const logoUrl = process.env.VITE_LOGO;
  const date = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 4px;">` : ''}
          <div>
            <strong>${item.name}</strong><br>
            <span style="font-size: 12px; color: #666;">
              ${item.selectedColor ? `Color: ${item.selectedColor}` : ''} 
              ${item.selectedSize ? `| Talla: ${item.selectedSize}` : ''}
            </span>
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.isSale && item.salePrice ? item.salePrice : item.price).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #000; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .details { margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 4px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
        .status { display: inline-block; padding: 4px 8px; background: #fff3cd; color: #856404; border-radius: 4px; font-size: 12px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TU TIENDA</div>
          <p>${isCustomer ? 'Confirmación de Pedido' : 'Nueva Venta Realizada'}</p>
        </div>

        <p>Hola ${isCustomer ? order.user_name : 'Admin'},</p>
        
        <p>
          ${isCustomer 
            ? 'Gracias por tu compra. Hemos recibido tu pedido correctamente.' 
            : `Se ha realizado una nueva compra por parte de <strong>${order.user_name}</strong> (${order.user_email}).`}
        </p>

        <div class="details">
          <p><strong>Pedido ID:</strong> #${order.id.slice(0, 8)}</p>
          <p><strong>Fecha:</strong> ${date}</p>
          <p><strong>Estado:</strong> <span class="status">${order.status}</span></p>
          <p><strong>Método de Pago:</strong> ${order.paymentMethod === 'pago-movil' ? 'Pago Móvil' : 'Transferencia'}</p>
          ${order.paymentDetails ? `
            <p><strong>Referencia:</strong> ${order.paymentDetails.referenceNumber}</p>
            <p><strong>Banco:</strong> ${order.paymentDetails.bank}</p>
          ` : ''}
        </div>

        <h3>Detalles del Pedido</h3>
        <table class="table">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Producto</th>
              <th style="padding: 10px; text-align: center;">Cant.</th>
              <th style="padding: 10px; text-align: right;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total">
          Total: $${order.total.toFixed(2)}
        </div>

        ${order.isGift ? `
          <div style="margin-top: 20px; padding: 15px; border: 1px dashed #ccc; background: #fff;">
            <h4 style="margin-top: 0;">🎁 Es un regalo para:</h4>
            <p><strong>Nombre:</strong> ${order.giftDetails?.recipientName}</p>
            <p><strong>Mensaje:</strong> "${order.giftDetails?.message}"</p>
          </div>
        ` : ''}

        <div style="margin-top: 20px;">
          <p><strong>Dirección de Envío:</strong><br>${order.shippingAddress}</p>
        </div>

        <div class="footer">
          <p>Si tienes alguna pregunta, responde a este correo.</p>
          <p>&copy; ${new Date().getFullYear()} Tu Tienda. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order } = await req.json();

    if (!order) {
      throw new Error("No order data provided");
    }

    console.log("Processing order email for:", order.id);

    const results = {
      customer: { success: false, error: null as any },
      admin: { success: false, error: null as any }
    };

    // 1. Send email to Customer
    try {
      const data = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: [order.user_email],
        subject: `Confirmación de Pedido #${order.id.slice(0, 8)}`,
        html: generateEmailHtml(order, true),
      });
      
      if (data.error) {
        console.error("Resend API Error (Customer):", data.error);
        results.customer.error = data.error;
      } else {
        results.customer.success = true;
      }
    } catch (err) {
      console.error("Exception sending customer email:", err);
      results.customer.error = err.message || err;
    }

    // 2. Send email to Admin
    try {
      const data = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: ["i.t.rafaelagar@gmail.com"],
        subject: `Nueva Venta: Pedido #${order.id.slice(0, 8)} - $${order.total.toFixed(2)}`,
        html: generateEmailHtml(order, false),
      });

      if (data.error) {
        console.error("Resend API Error (Admin):", data.error);
        results.admin.error = data.error;
      } else {
        results.admin.success = true;
      }
    } catch (err) {
      console.error("Exception sending admin email:", err);
      results.admin.error = err.message || err;
    }

    // Return 200 if at least one email was attempted, but include errors in body
    return new Response(
      JSON.stringify({ 
        message: "Email processing complete", 
        results 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Fatal function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
