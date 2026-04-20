import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { BigNumberInput } from "@medusajs/types"

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || null
console.log("[MP] Token cargado:", process.env.MP_ACCESS_TOKEN?.substring(0, 20))
type InitiatePaymentContext = {
  amount: BigNumberInput
  currency_code: string
  context: Record<string, unknown> & {
    items?: Array<{ title: string; quantity: number; unit_price: number }>
  }
}

export default class MercadoPagoPaymentProvider extends AbstractPaymentProvider {
  static identifier = "mercadopago"

  async initiatePayment(
    input: Parameters<AbstractPaymentProvider["initiatePayment"]>[0]
  ): ReturnType<AbstractPaymentProvider["initiatePayment"]> {
    const items = (input.context as InitiatePaymentContext["context"] | undefined)?.items
    console.log("[MP] ACCESS TOKEN presente:", !!MP_ACCESS_TOKEN)
    if (!MP_ACCESS_TOKEN) {
      return {
        id: "mercadopago_mock_preference",
        data: {
          status: "pending",
          checkoutUrl: "https://sandbox.mercadopago.com.ar/mock-checkout",
        },
      }
    }
    console.log("[MP] FRONTEND_URL:", process.env.FRONTEND_URL)
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: items?.length
          ? items.map((item) => ({
              title: item.title,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
              currency_id: "ARS",
            }))
          : [
              {
                title: "Compra en Krepla Racing Parts",
                quantity: 1,
                unit_price: Number(input.amount),
                currency_id: "ARS",
              }
            ],
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success`,
          failure: `${process.env.FRONTEND_URL}/checkout/failure`,
          pending: `${process.env.FRONTEND_URL}/checkout/pending`,
        },
      }),
    })

    const data = await response.json()
    console.log("[MP] Preference creada:", JSON.stringify(data))
    console.log("[MP] Response:", JSON.stringify(data))
    const preferenceId = String(data?.id ?? "mercadopago_preference")

    return {
      id: preferenceId,
      data: {
        status: "pending",
        preferenceId,
        checkoutUrl: data.init_point,
      },
    }
  }

  async authorizePayment(
    input: Parameters<AbstractPaymentProvider["authorizePayment"]>[0]
  ): ReturnType<AbstractPaymentProvider["authorizePayment"]> {
    const paymentSessionData = input.data ?? {}
    const mpStatus = (paymentSessionData.mp_status ?? paymentSessionData.status) as
      | string
      | undefined
    if (mpStatus === "approved") {
      return { status: "authorized", data: { ...paymentSessionData } }
    }
    return { status: "pending", data: { ...paymentSessionData } }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return { ...paymentSessionData, status: "capturado" }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return { ...paymentSessionData, status: "cancelado" }
  }

  async refundPayment(
    input: Parameters<AbstractPaymentProvider["refundPayment"]>[0]
  ): ReturnType<AbstractPaymentProvider["refundPayment"]> {
    const paymentSessionData = input.data ?? {}
    const refundAmount = input.amount
    if (!MP_ACCESS_TOKEN) return { ...paymentSessionData }    

    await fetch(`https://api.mercadopago.com/v1/payments/${paymentSessionData.paymentId}/refunds`, {
      method: "POST",
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify({ amount: refundAmount }),
    })

    return { ...paymentSessionData }
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return paymentSessionData
  }

  async updatePayment(
    input: Parameters<AbstractPaymentProvider["updatePayment"]>[0]
  ): ReturnType<AbstractPaymentProvider["updatePayment"]> {
    return { data: input.data ?? {} }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return paymentSessionData
  }

  async getPaymentStatus(
    input: Parameters<AbstractPaymentProvider["getPaymentStatus"]>[0]
  ): ReturnType<AbstractPaymentProvider["getPaymentStatus"]> {
    const paymentSessionData = input.data ?? {}
    const status = (paymentSessionData.mp_status ?? paymentSessionData.status) as
      | string
      | undefined
    if (status === "approved") return { status: "captured" }
    if (status === "rejected") return { status: "canceled" }
    return { status: "pending" }
  }

  async getWebhookActionAndData(
    payload: Parameters<AbstractPaymentProvider["getWebhookActionAndData"]>[0]
  ): ReturnType<AbstractPaymentProvider["getWebhookActionAndData"]> {
    const data = payload.data as any
    if (data?.action === "payment.updated" && data?.data?.status === "approved") {
      return {
        action: "authorized",
        data: {
          session_id: data.data.metadata?.session_id,
          amount: data.data.transaction_amount,
        },
      }
    }
    return { action: "not_supported" }
  }
}