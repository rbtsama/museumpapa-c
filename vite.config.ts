import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server for the MuseumPapa C-side (consumer) app.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
});
