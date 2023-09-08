//! 인섬니아 오류 중 흰바탕에 검은 글씨 -> api 주소를 잘 보자!!

import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

/** 댓글 생성 API **/
// 로그인 토큰을 검사하여, 유효한 토큰일 경우에만 댓글 작성 가능
// 댓글 내용을 비워둔 채 댓글 작성 API 호출하면 "댓글 내용을 입력해주세요" 라는 메세지 return
// 댓글 내용을 입력하고 댓글 작성 API 호출한 경우 작성한 댓글을 추가하기

/**
 * postId -> 파람이
 * userId -> authMiddleware
 * content -> 바디
 * 파람이 findFirst -> 게시글이 존재하지 않습니다.
 * 바디 없으면 -> 데이터 형식이 올바르지 않습니다.
 * 예외 케이스 -> 댓글 작성에 실패하였습니다.
 **/

router.post(
  "/posts/:postId/comments",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { postId } = req.params;
      const { userId } = req.user;
      const { content } = req.body;

      const post = await prisma.posts.findUnique({
        where: {
          postId: +postId,
        },
      });
      if (!content) {
        return res
          .status(404)
          .json({ message: "데이터 형식이 올바르지 않습니다." });
      }
      const comment = await prisma.comments.create({
        // 스키마에서 자동 등록 되는 부분 빼고 다 넣어야함!! 안 넣으면 오류남
        data: {
          UserId: +userId, // 댓글 작성자 ID
          PostId: +postId, // 댓글 작성 게시글 ID
          content: content,
        },
      });

      return res.status(201).json({ message: "댓글을 작성하였습니다." });
    } catch (err) {
      next(err);
      // return res.status(400).json({message: 댓글 작성에 실패하였습니다.})
    }
  }
);

/** 댓글 조회 API **/
// 조회하는 게시글에 작성된 모든 댓글을 목록 형식으로 볼 수 있도록 하기
// 작성 날짜 기준으로 내림차순 정렬

router.get("/posts/:postId/comments", async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
    });
    if (!post)
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });

    const comments = await prisma.comments.findMany({
      where: {
        PostId: +postId,
      },
      select: {
        User: {
          select: {
            nickname: true,
          },
        },
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ data: comments });
  } catch (err) {
    next(err);
    // return res.status(400).json({message: 댓글 조회에 실패하였습니다.})
  }
});

/** 댓글 수정 **/
// 로그인 토큰을 검사하여, 해당 사용자가 작성한 댓글만 수정 가능
// 댓글 내용을 비워둔 채 댓글 수정 API를 호출하면 "댓글 내용을 입력해주세요" 라는 메세지 return
// 댓글 내용을 입력하고 댓글 수정 API를 호출한 경우 작성한 댓글을 수정하기

/**
 * userId -> req.user
 * postId, commentId -> req.params
 * content -> req.body
 * !postId "게시글이 존재하지 않습니다."
 * userId !== comment.UserId "댓글의 수정 권한이 존재하지 않습니다."
 * !content "데이터 형식이 올바르지 않습니다."
 * !commentId "댓글이 존재하지 않습니다."
 * 댓글 수정 실패 시 "댓글 수정에 실패하였습니다."
 */

router.put(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { postId, commentId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res
          .status(404)
          .json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
      }

      const post = await prisma.posts.findUnique({
        // postId: +postId -> posts.postId: req.params
        where: { postId: +postId },
      });

      if (!post) {
        return res
          .status(404)
          .json({ errorMessage: "게시글이 존재하지 않습니다." });
      }
      console.log(commentId);
      const comment = await prisma.comments.findUnique({
        // postId: +postId -> posts.postId: req.params
        where: { commentId: +commentId },
      });
      console.log(commentId);

      if (!comment) {
        return res
          .status(404)
          .json({ errorMessage: "댓글이 존재하지 않습니다." });
      }

      if (userId !== comment.UserId) {
        return res
          .status(404)
          .json({ errorMessage: "댓글의 수정 권한이 존재하지 않습니다." });
      }

      // 5. 모든 조건을 통과하였다면 **댓글을 수정**합니다.
      await prisma.comments.update({
        data: { content },
        where: {
          commentId: +commentId,
        },
      });
      return res.status(200).json({ data: "댓글을 수정하였습니다." });
    } catch (err) {
      next(err);
      // return res.status(400).json({ message: "댓글 수정에 실패하였습니다." });
      // * 에러처리 부분 잘 모르겠음ㅠㅠ, catch() 괄호 안 err 의미, next(err)로 넘어갔을 때 각각 다른 메세지 나올 수 있게 하는 방법 알아보기!!
    }
  }
);

/** 댓글 삭제 **/
// 로그인 토큰을 검사하여, 해당 사용자가 작성한 댓글만 삭제 가능
// 원하는 댓글을 삭제하기
// API 명세서에 댓글 삭제에 실패한 경우 / 예외 케이스에서 처리하지 못한 에러 차이를 잘 모르겠당
/**
 * userId -> req.user
 * postId, commentId -> req.params
 * !post  "게시글이 존재하지 않습니다."
 * userId !== 댓글유저(findUnique.UserId(외래키)) "댓글의 삭제 권한이 존재하지 않습니다."
 * !comment "댓글이 존재하지 않습니다."
 * "댓글 삭제가 정상적으로 처리되지 않았습니다."
 * "댓글 삭제에 실패하였습니다."
 */
router.delete(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { postId, commentId } = req.params;

      const post = await prisma.posts.findUnique({
        // postId: +postId -> posts.postId: req.params
        where: { postId: +postId },
      });

      if (!post) {
        return res
          .status(404)
          .json({ errorMessage: "게시글이 존재하지 않습니다." });
      }

      const comment = await prisma.comments.findUnique({
        where: { commentId: +commentId },
      });

      if (userId !== comment.UserId) {
        return res
          .status(404)
          .json({ errorMessage: "댓글의 삭제 권한이 존재하지 않습니다." });
      }

      if (!comment) {
        return res
          .status(404)
          .json({ errorMessage: "댓글이 존재하지 않습니다." });
      }

      // 5. 모든 조건을 통과하였다면 **게시글을 삭제**합니다.
      // * await는 어떨 때 들어가는 지 알아보쟈!!
      await prisma.comments.delete({
        // * 이부분 comment.delete 가능?
        where: {
          commentId: +commentId,
        },
      });
      return res.status(200).json({ data: "댓글을 삭제하였습니다." });
    } catch (err) {
      next(err);
      // return res.status(400).json({ message: "댓글 삭제에 실패하였습니다." });
      // * 에러처리 부분 잘 모르겠음ㅠㅠ, catch() 괄호 안 err 의미, next(err)로 넘어갔을 때 각각 다른 메세지 나올 수 있게 하는 방법 알아보기!!
    }
  }
);

export default router;
