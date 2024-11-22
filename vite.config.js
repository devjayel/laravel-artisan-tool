import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    base: "./", // Ensures relative paths in production build
    build: {
        outDir: "dist", // Where the build files go
    },
});
