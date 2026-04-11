import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../lib/email"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function orderPlacedHandler({
    event: { data },
    container,
  }: SubscriberArgs<{ id: string }>) {
    const orderService = container.resolve("order")
    const customerService = container.resolve("customer")
  
    const order = await orderService.retrieveOrder(data.id)

    if (!order.customer_id) {
        console.log(`El pedido ${order.id} no tiene customer asociado, se omite el email.`)
        return
    }
    
    // Buscamos el customer por separado
    const customer = await customerService.retrieveCustomer(order.customer_id)
  
    // Email al comprador
    await sendOrderConfirmationEmail(customer.email, order.id)
  
    // Email al dueño
    await resend.emails.send({
      from: "Krepla Racing Parts <onboarding@resend.dev>",
      to: process.env.OWNER_EMAIL!,
      subject: `Nuevo pedido #${order.id}`,
      html: `<p>Recibiste un nuevo pedido de <strong>${customer.email}</strong>.</p>
             <p>ID del pedido: <strong>${order.id}</strong></p>`,
    })
}

export const config: SubscriberConfig = {
  event: "order.updated",
}