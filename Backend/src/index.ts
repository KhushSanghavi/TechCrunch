import { Hono } from "hono";
import { userRouter } from "./routes/user";
import { blogrouter } from "./routes/blog";
import { cors } from "hono/cors";

// have used generics to tell the ts that data_url is a string
const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

app.use("/*", cors());
app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogrouter);

export default app;
