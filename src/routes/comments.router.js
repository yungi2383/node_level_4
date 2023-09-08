import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

/** 댓글 생성 API **/
// * 로그인 토큰을 검사하여, 유효한 토큰일 경우에만 댁슬 작성 가능
// * 댓글 내용을 비워둔 채 댓글 작성 API 호출하면 "댓글 내용을 입력해주세요" 라는 메세지 return
// * 댓글 내용을 입력하고 댓글 작성 API 호출한 경우 작성한 댓글을 추가하기

router.post(
  "/posts/:postId/comments",
  authMiddleware,
  async (req, res, next) => {
    const { postId } = req.params;
    const { userId } = req.user;
    const { content } = req.body;

    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
    });
    if (!post)
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });

    const comment = await prisma.comments.create({
      data: {
        UserId: +userId, // 댓글 작성자 ID
        PostId: +postId, // 댓글 작성 게시글 ID
        content: content,
      },
    });

    return res.status(201).json({ data: comment });
  }
);



/** 댓글 조회 API **/
// * 조회하는 게시글에 작성된 모든 댓글을 목록 형식으로 볼 수 있도록 하기
// * 작성 날짜 기준으로 내림차순 정렬

router.get('/posts/:postId/comments', async (req, res, next) => {
    const { postId } = req.params;
  
    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
    });
    if (!post)
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });
  
    const comments = await prisma.comments.findMany({
      where: {
        PostId: +postId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  
    return res.status(200).json({ data: comments });
  });

  /** 댓글 수정 **/
  // * 로그인 토큰을 검사하여, 해당 사용자가 작성한 댓글만 수정 가능
  // * 댓글 내용을 비워둔 채 댓글 수정 API를 호출하면 "댓글 내용을 입력해주세요" 라는 메세지 return
  // * 댓글 내용을 입력하고 댓글 수정 API를 호출한 경우 작성한 댓글을 수정하기

  /** 댓글 삭제 **/
  // * 로그인 토큰을 검사하여, 해당 사용자가 작성한 댓글만 삭제 가능
  // * 원하는 댓글을 삭제하기

export default router;
