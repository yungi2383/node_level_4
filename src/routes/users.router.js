// src/routes/users.router.js
// * message -> errorMessage로 바꾸기!!

import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/** 사용자 회원가입 API **/

router.post("/signup", async (req, res, next) => {
  try {
    //  닉네임, 비밀번호, 비밀번호 확인을 request에서 전달받기
    const { nickname, password, confirm } = req.body;
    const isExistUser = await prisma.users.findFirst({
      where: {
        nickname,
      },
    });

    //  닉네임 최소 3자 이상, 알파벳 대소문자, 숫자로 구성
    const regex = /^[a-zA-Z0-9]*$/;

    if (!regex.test(nickname) || nickname.lengths < 3) {
      return res
        .status(412)
        .json({ message: "닉네임의 형식이 일치하지 않습니다." });
    }

    //  비밀번호 확인은 비밀번호와 정확하게 일치
    if (password !== confirm) {
      return res.status(412).json({ message: "패스워드가 일치하지 않습니다." });
    }

    //비밀번호 최소 4자 이상
    if (password.lengths < 4) {
      return res
        .status(412)
        .json({ message: "패스워드 형식이 일치하지 않습니다." });
    }

    //  닉네임과 같은 값이 비밀번호에 포함된 경우
    if (password.search(nickname) > -1) {
      return res
        .status(412)
        .json({ message: "패스워드에 닉네임이 포함되어 있습니다." });
    }

    // 닉네임 중복
    if (isExistUser) {
      return res.status(409).json({ message: "중복된 닉네임입니다." });
    }

    // Users 테이블에 사용자를 추가합니다.
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        nickname,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: "회원가입에 성공하였습니다." });
  } catch (err) {
    next(err);
    // return res.status(400).json({ message: "요청한 데이터 형식이 올바르지 않습니다." });
    // * 에러처리 부분 잘 모르겠음ㅠㅠ, catch() 괄호 안 err 의미, next(err)로 넘어갔을 때 각각 다른 메세지 나올 수 있게 하는 방법 알아보기!!
  }
});

// 닉네임, 비밀번호 request에서 전달받기
// (로그인 버튼 누른 후) 닉네임, 비밀번호가 데이터베이스에 등록됐는지 확인 -> 맞지 않는 정보 있을 시
// -> "닉네임 또는 패스워드를 확인해주세요" 에러메세지 response에 포함
// 로그인 성공 시 로그인에 성공한 유저의 정보 JWT를 활용, 클라이언트에게 cookie로 전달

/** 로그인 API **/
router.post("/login", async (req, res, next) => {
  try {
    const { nickname, password } = req.body;
    const user = await prisma.users.findFirst({ where: { nickname } });

    // 입력받은 사용자의 비밀번호와 데이터베이스에 저장된 비밀번호를 비교합니다.
    // user.password 는 hashedPassword 임
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res
        .status(401)
        .json({ message: "닉네임 또는 패스워드를 확인해주세요." });

    // 로그인에 성공하면, 사용자의 userId를 바탕으로 토큰을 생성합니다.
    // 쿠키 발급을 위해 필요한 jwt 이용
    // sign(생성을 위한 메서드)
    const token = jwt.sign(
      {
        userId: user.userId,
      },
      process.env.KEY// 비밀키, dotenv를 이용해서, 외부에서 코드를 보더라도, 알 수 없도록 구현해야함 (지금은 평문 사용)
    );

    // authotization 쿠키에 Berer 토큰 형식으로 JWT를 저장합니다.
    // (쿠키의 이름을 authorization 타입으로 전달하겠다!, 들어있는 값은 bearer 타입의 문자열 ${토큰 할당})
    res.cookie("authorization", `Bearer ${token}`);
    return res.status(200).json({ token: `${token}` });
    // 로그인 후 쿠키 확인해보면 authorization	Bearer%20eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY5NDExMjUwNn0.vsNEb16tQ-43K1X0regfi43jY8qtoZR64Y5-4XSWKFg
    // authorization(키값)이란 쿠키에 Bearer(%20 스페이스)토큰(ey~~)
  } catch (err) {
    next(err);
    // return res.status(400).json({ message: "로그인에 실패하였습니다." });
  }
});

// /** 사용자 조회 API **/
// // get 메서드, /users 사용 시 오른쪽의 (authMiddleware) 실행, next() 콜백함수 실행 시 오른쪽 api(사용자 조회) 실행
// router.get("/users", authMiddleware, async (req, res, next) => {
//   try {
//     // 1. 클라이언트가 로그인된 사용자인지 검증
//     // req.user -> authMiddleware에서 가져옴 (인증된 사용자)
//     const { userId } = req.user;

//     // 2. 사용자를 조회할 때, 1:1 관계를 맺고 있는 Users와 UserIsfos 테이블을 조회
//     const user = await prisma.users.findFirst({
//       where: { userId: +userId },
//       // 특정 컬럼만 조회하는 파라미터
//       select: {
//         userId: true,
//         email: true,
//         // password: false -> 생략 가능
//         createdAt: true,
//         updatedAt: true,
//         UserInfos: {
//           // 1:1 관계를 맺고있는 UserInfos 테이블을 조회합니다.
//           select: {
//             name: true,
//             age: true,
//             gender: true,
//             profileImage: true,
//           },
//         },
//       },
//     });

//     return res.status(200).json({ data: user });
//   } catch (err) {
//     next(err);
//   }
// });

export default router;
