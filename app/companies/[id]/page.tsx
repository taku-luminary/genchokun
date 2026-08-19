import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { CompanyInfoCard } from "@/app/_components/CompanyInfoCard";
import { InterviewArticle } from "@/app/_components/InterviewArticle";
import type { InterviewArticlePublic } from "@/app/_types/articles";
import { getCompanyOverallRating } from "@/app/_libs/companyRatings";

// DB取得を cache() で包む。同じリクエスト内なら generateMetadata と
// ページ本体で呼んでも、実際のDBアクセスは1回だけになる。
const getCompany = cache(async (id: string) => {
  return prisma.companies.findUnique({
    where: { id: BigInt(id) },
    include: {
      prefecture: true,
      interviewArticle: { include: { blocks: true } },
    },
  });
});

// ページの <head>（title / description / OGP）を企業ごとに生成する
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const company = await getCompany(id);

  if (!company) {
    return { title: "企業が見つかりません | 現調くん" };
  }

  const location = [company.prefecture.name, company.city]
    .filter(Boolean)
    .join(" ");
  // description は説明文があれば先頭120文字、なければ定型文
  const description = company.description
    ? company.description.slice(0, 120)
    : `${company.name}（${location}）の企業情報を掲載中。現調くん（調査・工事のマッチングサービス）`;

  const title = `${company.name} | 現調くん`;

  return {
    title,
    description,
    // SNSでシェアされた時のカード表示用
    openGraph: {
      title,
      description,
    },
  };
}

export default async function CompanyPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ↑の generateMetadata と同じ関数を呼ぶが、cache により実DBアクセスは1回
  const company = await getCompany(id);

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
        youtubeUrl: a.youtubeUrl,
        companyIntroText,
        workStyleText,
      };  
  }

  const companyRating = await getCompanyOverallRating(company.id.toString());

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
    rating: companyRating,
  };


  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

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
