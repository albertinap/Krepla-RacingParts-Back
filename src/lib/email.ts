import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Krepla Racing Parts <onboarding@resend.dev>"

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${process.env.STORE_CORS}/verify-email?token=${token}`
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verificá tu cuenta en Krepla Racing Parts",
    html: `<p>Hacé clic en el siguiente link para verificar tu cuenta:</p>
           <a href="${url}">${url}</a>`,
  })
}

export async function sendOrderConfirmationEmail(to: string, orderId: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirmación de tu pedido - Krepla Racing Parts",
    html: `<p>Tu pedido <strong>#${orderId}</strong> fue confirmado. ¡Gracias por tu compra!</p>`,
  })
}

export async function sendOrderStatusEmail(to: string, orderId: string, status: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Actualización de tu pedido #${orderId}`,
    html: `<p>Tu pedido <strong>#${orderId}</strong> tiene una nueva actualización: <strong>${status}</strong></p>`,
  })
}