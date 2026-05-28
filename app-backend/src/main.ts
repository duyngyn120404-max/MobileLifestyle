import express from "express";

import { env } from "./config/env.js";
import { corsMiddleware } from "./middlewares/cors.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { routes } from "./routes/index.js";

const app = express();

app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use("/api/v1", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(env.port, () => {
  console.log(`App Backend listening on port ${env.port}`);
});
