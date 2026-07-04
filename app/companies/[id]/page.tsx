import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { CompanyInfoCard } from "@/app/_components/CompanyInfoCard";
import { InterviewArticle } from "@/app/_components/InterviewArticle";
import type { InterviewArticlePublic } from "@/app/_types/articles";

export default async function CompanyPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // サーバー上でDBから直接取得（ブラウザのJSではない）
  const company = await prisma.companies.findUnique({
    where: { id: BigInt(id) },
    include: {
      prefecture: true,
      interviewArticle: { include: { blocks: true } },
    },
  });

  // 存在しない企業IDなら Next.js 標準の404へ
  if (!company) notFound();

  // 閲覧者の状態（未ログインなら両方 false）
  const user = await getAuthUser();
  let isMyCompany = false;
  let isAdmin = false;
  if (user) {
    isMyCompany = user.id === company.userId;
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });
    isAdmin = dbUser?.isAdmin ?? false;
  }

  // 公開中(published)の記事だけをセクション本文に均す
  let article: InterviewArticlePublic | null = null;
  const a = company.interviewArticle;
  if (a && a.status === "published") {
    const companyIntroText =
      a.blocks.find(
        (b) => b.sectionKey === "company_intro" && b.blockType === "text"
      )?.textContent ?? null;
    const workStyleText =
      a.blocks.find(
        (b) => b.sectionKey === "work_style" && b.blockType === "text"
      )?.textContent ?? null;
    article = {
      title: a.title,
      introText: a.introText,
      companyIntroText,
      workStyleText,
    };
  }

  // CompanyInfoCard に渡す形に整形
  const companyInfo = {
    id: company.id.toString(),
    name: company.name,
    prefecture: company.prefecture.name,
    city: company.city,
    address: company.address,
    representativeName: company.representativeName,
    employeeCount: company.employeeCount,
    websiteUrl: company.websiteUrl,
    description: company.description,
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* 編集ボタン群（本人＝自社情報編集 / 管理者＝記事編集） */}
        {(isMyCompany || isAdmin) && (
          <div className="flex justify-end gap-2">
            {isMyCompany && (
              <Link
                href="/mypage/settings/company"
                className="px-5 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-sm hover:bg-slate-200 transition"
              >
                自社情報を編集
              </Link>
            )}
            {isAdmin && (
              <Link
                href={`/admin/companies/${id}/article/edit`}
                className="px-5 py-1.5 rounded-xl bg-brand-green text-white border border-brand-green text-sm hover:opacity-90 transition"
              >
                記事を編集
              </Link>
            )}
          </div>
        )}

        <CompanyInfoCard
          title="企業情報"
          subtitle="この企業が掲載している情報です"
          company={companyInfo}
        />

        {article && <InterviewArticle article={article} />}
      </div>
    </div>
  );
}
