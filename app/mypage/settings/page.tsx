"use client";

import { BuildingOffice2Icon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { LinkList, LinkListItem } from "@/app/_components/ui/LinkList";
import { LogoutButton } from "@/app/_components/LogoutButton";

// 各種設定の入口（ヘッダーの「各種設定」から来る）。
// 自社情報（取引相手に見える情報）とログイン情報（ログインにだけ使う情報）は性質が違うので、
// 各項目に「何ができて、誰に見えるか」の説明を添え、どこを変えればよいか迷わないようにする
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">各種設定</h1>

      <LinkList>
        <LinkListItem
          href="/mypage/settings/company"
          icon={<BuildingOffice2Icon className="h-5 w-5" />}
          title="自社情報の編集"
          description="会社名・所在地・連絡先などを編集します。会社情報は企業ページで公開され、連絡先はマッチングが成立した相手にだけ表示されます。"
        />
        <LinkListItem
          href="/mypage/settings/email"
          icon={<EnvelopeIcon className="h-5 w-5" />}
          title="ログイン用メールアドレスの変更"
          description="ログインに使うメールアドレスを変更します。取引相手には表示されません（相手に表示される連絡用メールアドレスは、自社情報で設定します）。"
        />
        <LinkListItem
          href="/mypage/settings/password"
          icon={<LockClosedIcon className="h-5 w-5" />}
          title="パスワードの変更"
          description="ログインに使うパスワードを変更します。取引相手には表示されません。"
        />
      </LinkList>

      {/* ログアウトは設定を変える項目とは性質が違う操作なので、別のカードに分けて押し間違いを防ぐ */}
      <div className="mt-6">
        <LinkList>
          <LogoutButton />
        </LinkList>
      </div>
    </div>
  );
}
