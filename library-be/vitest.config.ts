import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // Mengaktifkan penggunaan API test secara global seperti describe, it, expect
    environment: "node", // Karena kita Backend, environment-nya di-set sebagai Node.js
    coverage: {
      provider: "v8", // Menggunakan engine V8 untuk coverage report
      reporter: ["text", "json", "html"], // Hasil coverage akan dicetak ke terminal (text) dan file HTML
      exclude: [
        "node_modules",
        "dist",
        ".git",
        "src/db/**", // Jangan test folder migrasi karena buatan tools
        "src/migrations/**",
      ],
    },
    // Jika nanti kita butuh setup mock DB secara otomatis, kita tambahkan file di sini
    setupFiles: [],
  },
});
