// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["./main.scss"],
  runtimeConfig: {
    public: {
      apiKey: process.env.API_KEY,
      cx: process.env.CX,
    },
  },
});
