import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import nodemailer from "nodemailer"
import fs from "fs"
import path from "path"
import Handlebars from "handlebars"

type SmtpOptions = {
  from: string
  transport: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
}

class SmtpNotificationService extends AbstractNotificationProviderService {
  static identifier = "smtp-notification"

  private transporter: nodemailer.Transporter
  private from: string

  constructor(_, options: SmtpOptions) {
    super()
    this.from = options.from
    this.transporter = nodemailer.createTransport(options.transport)
  }

  async send(notification: any): Promise<any> {
    const { to, template, data } = notification
  
    const templatePath = path.join(
      process.cwd(),
      "src",
      "email-templates",
      `${template}.html`
    )
  
    const source = fs.readFileSync(templatePath, "utf-8")
    const compiled = Handlebars.compile(source)
    const html = compiled(data || {})
  
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: this.getSubject(template),
      html,
    })
  
    return { id: `smtp-${Date.now()}` }
  }

  private getSubject(template: string): string {
    const subjects: Record<string, string> = {
      "customer-created": "Bienvenido a Krepla Racing Parts",
      "order-placed": "Confirmación de tu pedido",
      "order-placed-owner": "Nuevo pedido recibido",
      "order-updated": "Tu pedido fue actualizado",
    }
    return subjects[template] ?? "Notificación de Krepla Racing Parts"
  }
}

export default SmtpNotificationService