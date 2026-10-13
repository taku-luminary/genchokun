import { NextResponse } from "next/server";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { recordTermsAgreement } from "@/app/_libs/recordTermsAgreement";
import type {
  TermsAgreementRequest,
  TermsAgreementResponse,
} from "@/app/mypage/terms-agreement/_type/termsAgreement";
import { logServerError } from "@/app/_libs/logServerError";

// POST /api/account/terms-agreement
// ログイン中の会員が、今の版の利用規約に同意したことを記録する（同意の画面のボタンから呼ぶ）
export async function POST(request: Request): Promise<NextResponse<TermsAgreementResponse>> {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // JSON として読めない送信は、同意の内容が分からないものとして扱う
    let body: TermsAgreementRequest | null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    // 同意は明示の操作でだけ記録する。画面のボタンは { agreed: true } を送るので、それ以外は記録しない
    if (body?.agreed !== true) {
      return NextResponse.json({ error: "同意の内容を確認できませんでした" }, { status: 400 });
    }

    await recordTermsAgreement(user.id, "consent_page");
    return NextResponse.json({ success: true });
  } catch (e) {
    logServerError("POST /api/account/terms-agreement", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
