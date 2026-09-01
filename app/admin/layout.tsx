import { redirect } from "next/navigation";
import { getAdminUser } from "@/app/_libs/getAdminUser";

// 管理画面は毎回サーバで権限判定する（静的化・キャッシュさせない）
export const dynamic = "force-dynamic";

// app/admin/ 配下のすべてのページを包む共通レイアウト。
// ここで管理者判定するので、配下に何ページ作っても自動でガードされる。
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser(); // 管理者なら {id, isAdmin}、違えば null
  if (!admin) redirect("/"); // 非管理者・未ログインは入口で弾く（中身は描画されない）

  return <>{children}</>;
}