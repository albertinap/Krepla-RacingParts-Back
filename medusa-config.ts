import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/transfer-payment/register",
            id: "transfer",
          },
          {
            resolve: "./src/modules/mercadopago-payment/register",
            id: "mercadopago",
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "./src/modules/smtp-notification",
            id: "smtp-notification",
            options: {
              channels: ["email"],
              from: process.env.SMTP_FROM,
              transport: {
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: process.env.SMTP_SECURE === "true",
                auth: {
                  user: process.env.SMTP_AUTH_USER,
                  pass: process.env.SMTP_AUTH_PASS,
                },
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              file_url: process.env.SUPABASE_STORAGE_URL,
              access_key_id: process.env.SUPABASE_STORAGE_ACCESS_KEY,
              secret_access_key: process.env.SUPABASE_STORAGE_SECRET_KEY,
              region: "us-east-1",
              bucket: process.env.SUPABASE_STORAGE_BUCKET,
              endpoint: process.env.SUPABASE_STORAGE_ENDPOINT,
            },
          },
        ],
      },
    }, 
  ],  
})