#!/usr/bin/env node

/**
 * Script to delete all customers from Sanity
 * Usage: node scripts/delete-all-customers.cjs
 *
 * This script deletes all customer documents from Sanity dataset.
 * Make sure you have SANITY_WRITE_TOKEN in your .env file.
 */

require("dotenv").config();
const { createClient } = require("@sanity/client");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2023-05-03",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

const deleteData = async () => {
  try {
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      console.error("❌ Error: NEXT_PUBLIC_SANITY_PROJECT_ID is not set");
      process.exit(1);
    }

    if (!process.env.SANITY_WRITE_TOKEN) {
      console.error("❌ Error: SANITY_WRITE_TOKEN is not set");
      process.exit(1);
    }

    console.log("🔄 Đang bắt đầu xóa customers...");
    console.log(`📊 Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`);
    console.log(
      `📦 Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET || "production"}`
    );

    // Hàm delete này chấp nhận query GROQ để xóa hàng loạt
    // Lưu ý: _type phải là "customer" (số ít), không phải "customers"
    await client.delete({ query: '*[_type == "customer"]' });

    console.log("✅ Đã xóa thành công tất cả customers!");
  } catch (err) {
    console.error("❌ Lỗi khi xóa:", err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
};

deleteData();
