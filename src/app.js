// ** app.use 에는 순서가 있는 거 같은데 import에도 있나...?

import express from "express";
import cookieParser from "cookie-parser";
import LogMiddleware from "./middlewares/log.middleware.js";
import ErrorHandlingMiddleware from "./middlewares/error-handling.middleware.js";
import router from "./routes/index.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = 3018;


app.use(express.urlencoded({ extended: false})); // form 데이터를 받기 위한 미들웨어
app.use(express.json());
app.use(cookieParser());

app.use(LogMiddleware);
// posts/like 에서  PostRouter가 우선처리되면 /like를 /:postId로 인식해서 오류남
app.use("/api", router);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});

export default app