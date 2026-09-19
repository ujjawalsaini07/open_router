import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@repo/db";


const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is missing for this environment");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });

export const prisma: PrismaClient = new PrismaClient({ adapter });

async function connectDB(): Promise<void> {
  let retries = MAX_RETRIES;
  let currentDelay = INITIAL_RETRY_DELAY;

  while (retries > 0) {
    try {
      await prisma.$connect();
      console.log("Postgres connected successfully");
      return;
    } catch (err) {
      retries -= 1;

      console.error(`Postgres connection failed. ${retries} retries left.`);
      console.error(`Error: ${(err as Error).message}`);

      if (retries === 0) {
        console.error("Max retries reached. Exiting application...");
        process.exit(1);
      }

      console.log(`Waiting ${currentDelay / 1000} seconds before retrying...`);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= 2;
    }
  }
}

export default connectDB;
