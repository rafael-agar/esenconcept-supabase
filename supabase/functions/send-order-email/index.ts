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
  total: number;
  shippingCost: number;
  discountAmount?: number;
  saleDiscount?: number;
  couponCode?: string;
  couponDiscount?: number;
  items: OrderItem[];
  shippingAddress: string;
  city?: string;
  postalCode?: string;
  paymentMethod: string;
  status: string;
  isGift?: boolean;
  giftDetails?: {
    recipientName: string;
    message: string;
  };
  paymentDetails?: {
    referenceNumber: string;
    bank: string;
    depositorName?: string;
    depositorId?: string;
  };
  user_email: string;
  user_name: string;
}

const generateEmailHtml = (order: Order, isCustomer: boolean, type: string = 'new_order') => {
  const logoUrl = "https://wrpsqmdwhwbruqgyjdis.supabase.co/storage/v1/object/public/product-images/ESEN%20logo%20negro.png";
  const date = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const originalSubtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const saleDiscount = order.saleDiscount || 0;

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 8px; border: 1px solid #eee;">` : ''}
          <div style="line-height: 1.4;">
            <strong style="color: #1a1a1a; font-size: 14px;">${item.name}</strong><br>
            <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">
              ${item.selectedColor ? `Color: ${item.selectedColor}` : ''} 
              ${item.selectedSize ? `${item.selectedColor ? ' | ' : ''}Talla: ${item.selectedSize}` : ''}
            </span>
          </div>
        </div>
      </td>
      <td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #666;">${item.quantity}</td>
      <td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; color: #1a1a1a;">
        $${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  let subject = '';
  let title = '';
  let message = '';

  if (type === 'payment_approved') {
    subject = `Pago Aprobado - Pedido #${order.id.slice(0, 8)}`;
    title = '¡Pago Aprobado!';
    message = `
      <p>Hola ${order.user_name},</p>
      <p>Nos complace informarte que tu pago ha sido <strong>aprobado exitosamente</strong>.</p>
      <p>En las próximas horas, tu pedido será enviado y recibirás un nuevo correo con la guía de rastreo correspondiente.</p>
      <p>Gracias por confiar en ESEN Concept.</p>
    `;
  } else {
    // Default: new_order
    subject = isCustomer ? `Confirmación de Pedido #${order.id.slice(0, 8)}` : `Nueva Venta: Pedido #${order.id.slice(0, 8)} - $${order.total.toFixed(2)}`;
    title = isCustomer ? 'Confirmación de Pedido' : 'Nueva Venta Realizada';
    message = `
      <p>Hola ${isCustomer ? order.user_name : 'Admin'},</p>
      <p>
        ${isCustomer 
          ? 'Gracias por tu compra. Hemos recibido tu pedido correctamente.' 
          : `Se ha realizado una nueva compra por parte de <strong>${order.user_name}</strong> (${order.user_email}).`}
      </p>
    `;
  }

  return {
    subject,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; padding: 40px; background-color: #ffffff; border-radius: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { text-align: center; padding-bottom: 30px; border-bottom: 1px solid #eee; margin-bottom: 30px; }
        .logo { margin-bottom: 15px; }
        .title { font-size: 20px; font-weight: 300; text-transform: uppercase; letter-spacing: 3px; color: #000; margin: 0; }
        .details { margin-bottom: 30px; background: #fafafa; padding: 20px; border: 1px solid #f0f0f0; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 30px; }
        .status { display: inline-block; padding: 4px 12px; background: #000; color: #fff; border-radius: 0; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <img src="${logoUrl}" alt="ESEN CONCEPT" style="max-width: 180px; height: auto;" />
          </div>
          <h1 class="title">${title}</h1>
        </div>

        ${message}

        <div class="details">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="margin: 0 0 5px 0;"><strong style="color: #888; font-size: 11px; text-transform: uppercase;">Pedido ID</strong><br>#${order.id.slice(0, 8)}</p>
              <p style="margin: 0 0 5px 0;"><strong style="color: #888; font-size: 11px; text-transform: uppercase;">Fecha</strong><br>${date}</p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0;"><strong style="color: #888; font-size: 11px; text-transform: uppercase;">Estado</strong><br><span class="status">${type === 'payment_approved' ? 'Pago Aprobado' : order.status}</span></p>
              <p style="margin: 0 0 5px 0;"><strong style="color: #888; font-size: 11px; text-transform: uppercase;">Método de Pago</strong><br>${order.paymentMethod === 'pago-movil' ? 'Pago Móvil' : 'Transferencia'}</p>
            </div>
          </div>
          ${order.paymentDetails ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
              <p style="margin: 0 0 5px 0;"><strong style="color: #888; font-size: 11px; text-transform: uppercase;">Referencia de Pago</strong><br>${order.paymentDetails.referenceNumber} (${order.paymentDetails.bank})</p>
              ${order.paymentDetails.depositorName ? `<p style="margin: 0;"><strong style="color: #888; font-size: 11px; text-transform: uppercase;">Depositante</strong><br>${order.paymentDetails.depositorName} ${order.paymentDetails.depositorId ? `(C.I. ${order.paymentDetails.depositorId})` : ''}</p>` : ''}
            </div>
          ` : ''}
        </div>

        <h3 style="font-size: 16px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 5px;">Detalles del Pedido</h3>
        <table class="table">
          <thead>
            <tr style="background: #fafafa;">
              <th style="padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #888;">Producto</th>
              <th style="padding: 12px 10px; text-align: center; font-size: 11px; text-transform: uppercase; color: #888;">Cant.</th>
              <th style="padding: 12px 10px; text-align: right; font-size: 11px; text-transform: uppercase; color: #888;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-left: auto; width: 100%; max-width: 280px; margin-top: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 5px 0; color: #666;">Subtotal:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: 500;">$${originalSubtotal.toFixed(2)}</td>
            </tr>
            ${saleDiscount > 0 ? `
            <tr>
              <td style="padding: 5px 0; color: #e53e3e;">Descuento por Oferta:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: 500; color: #e53e3e;">-$${saleDiscount.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${order.discountAmount && order.discountAmount > 0 ? `
            <tr>
              <td style="padding: 5px 0; color: #e53e3e;">
                Cupón ${order.couponCode ? `(${order.couponCode}${order.couponDiscount ? ` - ${order.couponDiscount}%` : ''})` : 'de Descuento'}:
              </td>
              <td style="padding: 5px 0; text-align: right; font-weight: 500; color: #e53e3e;">-$${order.discountAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 5px 0; color: #666;">Envío:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: 500; ${order.shippingCost === 0 ? 'color: #38a169;' : ''}">
                ${order.shippingCost === 0 ? 'Gratis' : `$${order.shippingCost.toFixed(2)}`}
              </td>
            </tr>
            <tr style="border-top: 2px solid #000;">
              <td style="padding: 10px 0; font-weight: bold; font-size: 18px;">Total:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px;">$${order.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${order.isGift ? `
          <div style="margin-top: 20px; padding: 15px; border: 1px dashed #ccc; background: #fff;">
            <h4 style="margin-top: 0;">🎁 Es un regalo para:</h4>
            <p><strong>Nombre:</strong> ${order.giftDetails?.recipientName}</p>
            <p><strong>Mensaje:</strong> "${order.giftDetails?.message}"</p>
          </div>
        ` : ''}

        <div style="margin-top: 20px; padding: 20px; background-color: #fafafa; border: 1px solid #f0f0f0;">
          <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Información de Envío</h4>
          <p style="margin: 0; font-size: 14px;">
            <strong>Dirección:</strong> ${order.shippingAddress}<br>
            ${order.city ? `<strong>Ciudad:</strong> ${order.city}<br>` : ''}
            ${order.postalCode ? `<strong>Código Postal:</strong> ${order.postalCode}` : ''}
          </p>
        </div>

        <div class="footer">
          <p>Si tienes alguna pregunta, responde a este correo.</p>
          <div style="margin-top: 10px;">
            <a href="https://wa.me/584226413853" style="text-decoration: none; color: #25D366; font-weight: bold; display: inline-block;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/20px-WhatsApp.svg.png" width="20" height="20" style="vertical-align: middle; margin-right: 5px;">
              Contactar por WhatsApp
            </a>
          </div>
          <p>&copy; ${new Date().getFullYear()} ESEN Concept. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
    `
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { order, type = 'new_order' } = body;

    if (!order) {
      throw new Error("No order data provided");
    }

    // Normalize order properties (handle both camelCase and snake_case)
    order = {
      ...order,
      total: order.total || order.total_amount || 0,
      shippingCost: order.shippingCost !== undefined ? order.shippingCost : (order.shipping_cost !== undefined ? order.shipping_cost : 0),
      discountAmount: order.discountAmount || order.discount_amount || 0,
      couponCode: order.couponCode || order.coupon_code || null,
      couponDiscount: order.couponDiscount || order.coupon_discount || 0,
      paymentMethod: order.paymentMethod || order.payment_method || '',
      shippingAddress: order.shippingAddress || order.shipping_address || '',
      city: order.city || order.shipping_city || '',
      postalCode: order.postalCode || order.shipping_postal_code || '',
      paymentDetails: order.paymentDetails || order.payment_details || null,
      isGift: order.isGift !== undefined ? order.isGift : (order.is_gift !== undefined ? order.is_gift : false),
      giftDetails: order.giftDetails || order.gift_details || null
    };

    console.log(`Processing ${type} email for:`, order.id);

    const results = {
      customer: { success: false, error: null as any },
      admin: { success: false, error: null as any }
    };

    // 1. Send email to Customer
    try {
      const emailContent = generateEmailHtml(order, true, type);
      const data = await resend.emails.send({
        from: "pedidos@esenconcept.com",
        to: [order.user_email],
        subject: emailContent.subject,
        html: emailContent.html,
        reply_to: "i.t.rafaelagar@gmail.com",
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

    // 2. Send email to Admin (only for new orders)
    if (type === 'new_order') {
      try {
        const emailContent = generateEmailHtml(order, false, type);
        const data = await resend.emails.send({
          from: "venta@esenconcept.com",
          to: ["i.t.rafaelagar@gmail.com"],
          subject: emailContent.subject,
          html: emailContent.html,
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
