import type { NextConfig } from "next";
const config: NextConfig = process.env.NETLIFY ? {} : { output: "standalone" };
export default config;
