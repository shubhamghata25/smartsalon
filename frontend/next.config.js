/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_UPI_ID: process.env.NEXT_PUBLIC_UPI_ID,
  },
};

module.exports = nextConfig;
