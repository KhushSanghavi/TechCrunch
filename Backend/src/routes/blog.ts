import { Hono, Context } from "hono";
// accelerate
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Bindings } from "hono/types";
import { verify } from "hono/jwt";
import { createBlogInput, updateBlogInput } from "@100xdevs/medium-common";
import { OpenAI } from "openai";
export const blogrouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    APIKEY: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogrouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("authorization") || ""; //it was giving errorbecause it can be string or null
  try {
    const user = await verify(authHeader, c.env.JWT_SECRET);
    if (user) {
      c.set("userId", user.id);
      // console.log(user.id);
      await next();
    } else {
      c.status(403);
      return c.json({
        message: "you are not logged in",
      });
    }
  } catch (e) {
    c.status(403);
    return c.json({
      message: "you are not logged in",
    });
  }
});

blogrouter.post("/", async (c) => {
  const body = await c.req.json();
  const { success } = createBlogInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      message: "inputs are not correct",
    });
  }
  const authorId = c.get("userId");
  if (!authorId) {
    // Handle case when authorId is not present
    c.status(401);
    return c.json({
      message: "User ID is missing",
    });
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: Number(authorId),
    },
  });

  return c.json({
    id: blog.id,
  });
});

blogrouter.put("/", async (c) => {
  const body = await c.req.json();
  const { success } = updateBlogInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      message: "inputs are not correct",
    });
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.update({
    where: {
      id: body.id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return c.json({
    id: blog.id,
  });
});

blogrouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blogs = await prisma.blog.findMany({
    select: {
      content: true,
      title: true,
      id: true,
      author: {
        select: {
          name: true,
        },
      },
    },
  });
  return c.json({
    blogs,
  });
});

blogrouter.post("/getResponse", async (c) => {
  try {
    const userPromptObj = await c.req.json();
    const userPrompt = userPromptObj.userPrompt;

    const openai = new OpenAI({
      apiKey: c.env.APIKEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: 100,
    });

    const final_response = response.choices[0].message.content;
    // console.log(final_response);

    return c.json({ final_response }); // Ensure finalization by returning a response
  } catch (error) {
    // console.error("Error:", error);
    c.status(500);
    c.json({ error: "Internal server error" }); // Ensure finalization by returning a response
  }
});

blogrouter.get("/:id", async (c) => {
  const id = await c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.blog.findFirst({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        title: true,
        content: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return c.json({
      blog,
    });
  } catch (e) {
    c.status(411);
    return c.json({
      message: "error while fetching blog post",
    });
  }
});
