import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { calcDaysLeft } from "@/app/_utils/format";
import type { HomeApiResponse, HomeProject, HomeRequest } from "@/app/_types/home";
import { getCompanyOverallRatingsByCompanyIds } from "@/app/_libs/companyRatings"; 

// 1回に返す件数の既定値と上限。画面（app/page.tsx）は20件ずつ取得している。
// 上限は、1回のリクエストで全件をまとめて取り出せないようにするため
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
// ページ番号の上限。極端に大きい値だと、読み飛ばす件数（skip）が Prisma の扱える整数の範囲を超えて 500 になるため。
// 20件ずつなら2万件まで辿れるので、今の規模には十分大きい
const MAX_PAGE = 1000;
// 検索に使う語の上限。語が1つ増えるごとに複数の列を調べる条件が増えるので、
// 語を大量に並べた検索1回で、DB に重い問い合わせが届かないようにする
const MAX_KEYWORDS = 5;

// クエリの値を「1以上 max 以下の整数」として読む。未指定・数字でない・小数・範囲外のときは fallback を返す。
// この API は未ログインでも呼べるため、どんな値が来ても 500 にせず、上限を超えて取り出せないようにする
function parseIntParam(value: string | null, max: number, fallback: number): number {
  if (value === null) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max) return fallback;
  return n;
}

// 「完了扱い」かどうかを判定（status が completed OR 日本時間で終了日を過ぎている）
function isEffectivelyCompleted(status: string, endDate: string | null): boolean {
  // : booleanの意味は、この関数は、最後に必ず true か false を返します。
  if (status === "completed") return true;
  // 終了日があり、日本時間の今日より前なら true。status が recruiting でも「完了扱い」にする
  const daysLeft = calcDaysLeft(endDate);
  if (daysLeft !== null && daysLeft < 0) return true;
  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse<HomeApiResponse>> {  // Promise< ... > → async関数なので、あとで返る
  // NextResponse< ... > → Next.jsのレスポンスを返す
  // HomeApiResponse → そのレスポンスの中身のJSONの型

  // タブごとに独立したページ番号を受け取る
  const { searchParams } = new URL(request.url);
  const projectsPage = parseIntParam(searchParams.get("projectsPage"), MAX_PAGE, 1);
  const requestsPage = parseIntParam(searchParams.get("requestsPage"), MAX_PAGE, 1);
  const limit = parseIntParam(searchParams.get("limit"), MAX_LIMIT, DEFAULT_LIMIT);
  // 検索キーワード。前後の空白を除去し、未指定なら空文字にする
  const q = (searchParams.get("q") ?? "").trim();
  // 半角・全角スペースで分割して空要素を除去（複数ワード検索に対応）。使うのは先頭の MAX_KEYWORDS 語まで
  const keywords = q.split(/[\s\u3000]+/).filter(Boolean).slice(0, MAX_KEYWORDS);

  // findMany（一覧）と count（総件数）で同じ条件を使うため、where を変数にまとめる
  // AND: 各ワードすべてを含む / OR: ワードがどれかのカラムに含まれる
  // keywords が空配列のとき AND: [] は「条件なし＝全件」になるので、空検索の分岐は不要
  const projectsWhere = {
    deletedAt: null,
    AND: keywords.map((kw) => ({
      OR: [
        { title: { contains: kw, mode: "insensitive" as const } },
        { summary: { contains: kw, mode: "insensitive" as const } },
        { city: { contains: kw, mode: "insensitive" as const } },
        { prefecture: { name: { contains: kw } } }, // 都道府県名（単一リレーション）
        { salesUser: { company: { name: { contains: kw, mode: "insensitive" as const } } } }, // 発注者の企業名
      ],
    })),
  };

  const requestsWhere = {
    deletedAt: null,
    // deletedAtがnullである かつ すべてのワードについてORの中のどれか1つに一致する
    AND: keywords.map((kw) => ({
      OR: [
        { title: { contains: kw, mode: "insensitive" as const } },
        { summary: { contains: kw, mode: "insensitive" as const } },
        { city: { contains: kw, mode: "insensitive" as const } },
        { prefectures: { some: { name: { contains: kw } } } }, // 多対多なので some（どれか1つでも一致）
        { contractorUser: { company: { name: { contains: kw, mode: "insensitive" as const } } } }, // 工事店の企業名
      ],
    })),
  };


  const [projects, totalProjects, requests, totalRequests] = await Promise.all([
    // Promise.all([A, B]) → AとBを同時にやって、両方終わったら結果を配列で返すJavaScript 標準の組み込みオブジェクト

      prisma.projects.findMany({
        where: projectsWhere,
        include: {
          prefecture: true,
          // 公開APIなので、カードに出す会社名と、評価の突き合わせに使う id だけを取る
          salesUser: { include: { company: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (projectsPage - 1) * limit, // 先頭から何件スキップするか
        take: limit,  // 何件取得するか
      }),

      prisma.projects.count({ where: projectsWhere }), // 案件の総件数（検索条件も反映）

      prisma.requests.findMany({
        where: requestsWhere,
        include: {
          // 対応可能エリア（複数）。id 昇順で取得して表示順を安定させる
          prefectures: { orderBy: { id: "asc" } },
          contractorUser: { include: { company: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (requestsPage - 1) * limit,
        take: limit,
      }),
      prisma.requests.count({ where: requestsWhere }), // 依頼待ちの総件数（検索条件も反映）
    ]);

  // ▼ 一覧に出てくる会社の「会社ID(文字列)」を集める。会社未登録(null)は flatMap で除外。
  //   （既存の mypage ルートと同じ「null なら空配列で飛ばす」書き方）
  const salesCompanyIds = projects.flatMap((p) =>
    p.salesUser.company ? [p.salesUser.company.id.toString()] : [],
  );
  const contractorCompanyIds = requests.flatMap((r) =>
    r.contractorUser.company ? [r.contractorUser.company.id.toString()] : [],
  );

  // 案件・依頼カードの発注者/工事店の評価。詳細ページ等と揃えて「両ロール合算」の総合評価で統一する。
  const [salesRatings, contractorRatings] = await Promise.all([
    getCompanyOverallRatingsByCompanyIds(salesCompanyIds),
    getCompanyOverallRatingsByCompanyIds(contractorCompanyIds),
  ]);

  const mappedProjects: HomeProject[] = projects.map((p) => ({
    id: p.id.toString(),
    createdAt: p.createdAt.toISOString(),
    prefecture: { name: p.prefecture.name },
    city: p.city,
    title: p.title,
    workStartDate: p.workStartDate?.toISOString() ?? null,
    workEndDate: p.workEndDate?.toISOString() ?? null,
    rewardType: p.rewardType,
    rewardYen: p.rewardYen === null ? null : Number(p.rewardYen),
    paymentCycle: p.paymentCycle,
    status: p.status,
    companyName: p.salesUser.company?.name ?? null,
    companyRating: p.salesUser.company
      ? salesRatings.get(p.salesUser.company.id.toString()) ?? null
      : null,
  }));

  const mappedRequests: HomeRequest[] = requests.map((r) => ({
    id: r.id.toString(),
    createdAt: r.createdAt.toISOString(),
    prefectures: r.prefectures.map((p) => ({ name: p.name })),
    city: r.city,
    title: r.title, // 追加
    availableStartDate: r.availableStartDate?.toISOString() ?? null,
    availableEndDate: r.availableEndDate?.toISOString() ?? null,
    summary: r.summary,
    paymentCycle: r.paymentCycle,
    rewardType: r.rewardType,
    rewardMinYen: r.rewardMinYen === null ? null : Number(r.rewardMinYen),
    status: r.status,
    companyName: r.contractorUser.company?.name ?? null,
    companyRating: r.contractorUser.company
      ? contractorRatings.get(r.contractorUser.company.id.toString()) ?? null
      : null,
  }));

  // 募集中が上・完了（期限切れ含む）が下、同じグループ内は投稿順（新しい順）
  const sortCards = <T extends { status: string; workEndDate?: string | null; availableEndDate?: string | null; createdAt: string }>
  (cards: T[]): T[] =>
    //sortCards に渡された引数 mappedProjects の型を見て、TypeScript が T を HomeProject だと推論してくれる
    cards.sort((a, b) => {
    //省略しないと、const sortCards = (cards) => {return cards.sort((a, b) => {...});};
    // .sort() の比較関数では、return で数字を返す。
    // return の結果がマイナスなら a が前、プラスなら b が前、0 なら順番はそのまま扱いになる。
    // return 以降には、最終的に数字を返す処理なら書ける。ただし、その数字が「a と b の順番を正しく表すルール」になっていないと、期待した並び替えにはならない。
      const endDateA = "workEndDate" in a ? a.workEndDate ?? null : a.availableEndDate ?? null;
      // 上記は→と同じconst endDateA = (() => { if ("workEndDate" in a) { return a.workEndDate ?? null; } else { return a.availableEndDate ?? null; } })();
      const endDateB = "workEndDate" in b ? b.workEndDate ?? null : b.availableEndDate ?? null;
      const aCompleted = isEffectivelyCompleted(a.status, endDateA);
      const bCompleted = isEffectivelyCompleted(b.status, endDateB);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const response: HomeApiResponse = {
      projects: sortCards(mappedProjects),
      requests: sortCards(mappedRequests),
      totalProjects,  
      totalRequests,  
    };
  
    return NextResponse.json(response);
}