import app from "./app.js";
import { allowedOrigins } from "./src/config/security.js";
import { isVercel, port } from "./src/config/env.js";

if (!isVercel) {
  app.listen(port,()=>{
    console.log(`[ylp] API listening on port ${port}`);
    console.log(`[ylp] Allowed frontend origin(s): ${allowedOrigins.join(", ")}`);
  });
}

export default app;
