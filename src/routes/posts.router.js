// src/routes/posts.router.js

import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/** 게시글 생성 API **/
// * 토큰을 검사하여 유효한 토큰일 경우에만 게시글 작성 가능
// * 제목, 작성 내용을 입력

// 1. 게시글을 작성하려는 클라이언트가 로그인된 사용자인지 검증합니다. (authMiddleware)
// auth.middleware.js 에서 한 일: req.cookies 에 저장된 유저 id와 일치하는 user 정보를 {user}에 담았당
router.post("/posts", authMiddleware, async (req, res, next) => {
  //authMiddleware 에서 담아온 user 정보에서 id만 추출, userId에 할당
  const { userId } = req.user;
  const { title, content } = req.body;

  const post = await prisma.posts.create({
    data: {
      UserId: userId,
      title,
      content,
    },
  });

  return res.status(201).json({ data: post });
});

/** 게시글 목록 조회 API **/
// * 제목, 닉네임, 작성 날짜 조회
// * 작성 날짜 기준으로 내림차순 정렬

router.get("/posts", async (req, res, next) => {
  const posts = await prisma.posts.findMany({
    select: {
      postId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc", // 게시글을 최신순으로 정렬합니다.
    },
  });

  return res.status(200).json({ data: posts });
});

/** 게시글 상세 조회 API **/
// * 제목, 작성자명, 작성날짜, 작성 내용 조회
router.get("/posts/:postId", async (req, res, next) => {
  const { postId } = req.params;
  const post = await prisma.posts.findFirst({
    where: {
      postId: +postId,
    },
    select: {
      postId: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ data: post });
});

/** 게시글 수정 **/
// * 토큰을 검사, 해당 사용자가 작성한 게시글만 수정 가능

/** 게시글 삭제 **/
// * 토큰을 검사하여, 해당 사용자가 작성한 게시글만 삭제 가능


export default router;
