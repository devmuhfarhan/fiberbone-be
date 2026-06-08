import pool from "../../config/db";
import dotenv from "dotenv";
import { seedDefaultAccounts } from "../../models/accountModel";

dotenv.config();

const seedAccounts = async () => {
  try {
    console.log("Seeding default accounts for all outlets...");

    // Ambil semua outlet
    const outletsResult = await pool.query("SELECT id, name FROM outlets");

    if (outletsResult.rows.length === 0) {
      console.log("No outlets found. Please run seed:outlet first.");
      process.exit(0);
    }

    let totalInserted = 0;

    for (const outlet of outletsResult.rows) {
      await seedDefaultAccounts(outlet.id);
      totalInserted++;
    }

    console.log(
      `Successfully seeded default accounts across ${totalInserted} outlets.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Error seeding accounts:", error);
    process.exit(1);
  }
};

seedAccounts();
