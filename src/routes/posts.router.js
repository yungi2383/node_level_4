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
  try {
    //authMiddleware 에서 담아온 user 정보에서 id만 추출, userId에 할당
    const { nickname } = req.user;
    const { title, content } = req.body;

    const post = await prisma.posts.create({
      data: {
        nickname,
        title,
        content,
      },
    }); // * 이부분에 nickname 빼면 작성자 어떻게 구분? 빼긴 해야함, Request Header에서는 쿠키값 보내는데 이걸로 구분하낭?

    return res.status(201).json({ message: "게시글 작성에 성공하였습니다." });
  } catch (err) {
    next(err);
    // return res.status(400).json({ message: "게시글 작성에 실패하였습니다." });
    // * 에러처리 부분 잘 모르겠음ㅠㅠ, catch() 괄호 안 err 의미, next(err)로 넘어갔을 때 각각 다른 메세지 나올 수 있게 하는 방법 알아보기!!
  }
});

/** 게시글 목록 조회 API **/
// 제목, 닉네임, 작성 날짜 조회
// 작성 날짜 기준으로 내림차순 정렬

router.get("/posts", async (req, res, next) => {
  const posts = await prisma.posts.findMany({
    select: {
      nickname: true,
      title: true,
      createdAt: true,
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
  try {
    const { postId } = req.params;
    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
      select: {
        nickname: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });
    return res.status(200).json({ data: post });
  } catch (err) {
    next(err);
    // return res.status(400).json({ message: "게시글 조회에 실패하였습니다." });
    // * 에러처리 부분 잘 모르겠음ㅠㅠ, catch() 괄호 안 err 의미, next(err)로 넘어갔을 때 각각 다른 메세지 나올 수 있게 하는 방법 알아보기!!
  }
});

/** 게시글 수정 **/
// * 토큰을 검사, 해당 사용자가 작성한 게시글만 수정 가능

router.put('/:postId', authMiddleware, async (req, res, next ) => {
    // 1. **Path Parameters**로 어떤 게시글을 수정할 지 `postId`를 전달받습니다.
    const { postId } = req.params;
    // 2. 변경할 `title`, `content`와 권한 검증을 위한 `password`를 **body**로 전달받습니다.
    const { password, title, content} = req.body;
    // 3. `postId`를 기준으로 게시글을 검색하고, 게시글이 존재하는지 확인합니다.
    const post = await prisma.posts.findUnique({
        where: {postId: +postId}
    });
    // 4. 게시글이 조회되었다면 해당하는 게시글의 `password`가 일치하는지 확인합니다.
    // 오류 검사 
    if(!post){
        return res.status(404).json({errorMessage : "게시글이 존재하지 않습니다." });
    } else if(post.password !== password){
        return res.status(401).json({ errorMessage: "비밀번호가 일치하지 않습니다."})
    }

    // 5. 모든 조건을 통과하였다면 **게시글을 수정**합니다.
    await prisma.posts.update({
        data: {title, content},
        where: {
            postId: +postId, 
            password
        }
    });

    return res.status(200).json({data : "게시글을 수정하였습니다."});
});



/** 게시글 삭제 **/
// * 토큰을 검사하여, 해당 사용자가 작성한 게시글만 삭제 가능

export default router;
