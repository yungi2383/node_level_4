//    1. 쿠키가 Bearer 토큰 형식인지 확인
//    2. 서버에서 발급한 JWT가 맞는지 검증 -> 비밀키 사용
//    3. JWT의 userId를 이용해 사용자를 조회
//    4. req.user에 조회된 사용자 정보를 할당
//    5. 다음 미들웨어를 실행 -> next()

import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

// 사용자 인증 미들웨어 -> 클라이언트로 부터 전달받은 쿠키를 검증하는 작업을 수행
// * 사용자 인증 시 req.cookies 값이 뭐지? 쿠키에 저장된 로그인 정보? 토큰?

export default async function (req, res, next) {
  try {
    // 1. 클라이언트로 부터 쿠키를 전달받는다.
    // const cookie(쿠키 중 authorization 만 사용 -> 객체 구조분해할당으로) = req.cookie
    const { authorization } = req.cookies;
    // throw new Error -> catch 문으로 넘기기
    // * 쿠키가 존재하지 않는 경우
    // * 쿠키가 비정상적이거나 만료된 경우
    if (!authorization) throw new Error("토큰이 존재하지 않습니다.");

    // 2. 쿠키가 Bearer 토큰 형식인지 확인
    // split -> authorization (bearer 토큰) 형태 ' '로 끊어주기 위함
    // tokenType = bearer / token = 토큰 할당 (배열 구조 분해 할당)
    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 일치하지 않습니다.");

    // 3. 서버에서 발급한 JWT가 맞는지 검증
    const decodedToken = jwt.verify(token, process.env.KEY);
    const userId = decodedToken.userId;

    // 4. JWT의 'userId'를 이용해 사용자를 조회
    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });
    if (!user) {
      res.clearCookie("authorization"); // 쿠키 삭제 (정상적인 쿠키가 아님)
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    }

    // 5. req.user에 조회된 사용자 정보를 할당
    req.user = user;

    // 6. 다음 미들웨어를 실행
    next();
  } catch (error) {
    // 특정 쿠키를 삭제 -> 쿠키 인증 실패 시
    res.clearCookie("authorization");

    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
    switch (error.name) {
      case "TokenExpiredError": // 토큰이 만료되었을 때 발생하는 에러
        return res.status(401).json({ message: "토큰이 만료되었습니다." });
      case "JsonWebTokenError": // 토큰에 검증이 실패했을 때, 발생하는 에러
        return res.status(401).json({ message: "토큰이 조작되었습니다." });
      default:
        return (
          res
            .status(401)
            // error message 있다면 해당 메세지 출력
            .json({ message: error.message ?? "비정상적인 요청입니다." })
        );
    }
  }
}
