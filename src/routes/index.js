import express from "express"
import UsersRouter from "./users.router.js";
import PostsRouter from "./posts.router.js";
import CommentsRouter from "./comments.router.js";
import LikesRouter from "./likes.router.js";

const router = express.Router()

router.use("/", [LikesRouter, UsersRouter,PostsRouter, CommentsRouter])

export default router;
