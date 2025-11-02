import "./server/load-env";
import { initializeDatabase } from "./server/init-db";

initializeDatabase()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
