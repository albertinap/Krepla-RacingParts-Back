import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderConfirmationEmail } from "../lib/email"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve("order")
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["customer"],
  })

  // Email al comprador
  await sendOrderConfirmationEmail(order.customer.email, order.id)

  // Email al dueño de la tienda
  await resend.emails.send({
    from: "Krepla Racing Parts <onboarding@resend.dev>",
    to: process.env.OWNER_EMAIL!,
    subject: `Nuevo pedido #${order.id}`,
    html: `<p>Recibiste un nuevo pedido de <strong>${order.customer.email}</strong>.</p>
           <p>ID del pedido: <strong>${order.id}</strong></p>`,
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}