import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAdminUser } from "@/app/_libs/getAdminUser";
import type {
  AdminArticleResponse,
  UpsertArticleRequest,
} from "@/app/_types/articles";

type ErrorResponse = { error: string };

// GET /api/admin/companies/[id]/article
// 編集画面の初期表示用。既存記事があれば返し、なければ { article: null }。
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AdminArticleResponse | ErrorResponse>> {
  try {
    // 管理者だけ通す（未ログイン・非管理者は 403）
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;

    const article = await prisma.company_interview_articles.findUnique({
      where: { companyId: BigInt(id) },
      include: { blocks: true },
    });

    if (!article) {
      // 未作成 → フォーム側で「新規作成モード」として扱えるよう null を返す
      return NextResponse.json({ article: null });
    }

    // ブロック構造 → セクションごとの本文テキストに均す（簡易版）
    const companyIntroText =
      article.blocks.find(
        (b) => b.sectionKey === "company_intro" && b.blockType === "text"
      )?.textContent ?? null;
      
    const workStyleText =
      article.blocks.find(
        (b) => b.sectionKey === "work_style" && b.blockType === "text"
      )?.textContent ?? null;

    return NextResponse.json({
      article: {
        title: article.title,
        introText: article.introText,
        companyIntroText,
        workStyleText,
        status: article.status,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/companies/[id]/article
// 記事を作成 or 更新（upsert）。記事本体＋各セクションの text ブロックをまとめて保存。
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ id: string } | ErrorResponse>> {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;
    const companyId = BigInt(id);

    const body: UpsertArticleRequest = await request.json();

    // 必須チェック（フォームでも弾くが、直叩き対策でAPIでも防御）
    if (!body.title || body.title.trim() === "") {
      return NextResponse.json(
        { error: "記事タイトルは必須です" },
        { status: 400 }
      );
    }

    // 紐づけ先の企業が存在するか確認（存在しない企業に記事は作れない）
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json({ error: "企業が見つかりません" }, { status: 404 });
    }

    // 公開時は publishedAt をセット、下書き時は null
    const publishedAt = body.status === "published" ? new Date() : null;

    // 記事本体の upsert → 既存ブロック削除 → 入力されたセクションだけ作り直す、を
    // 1つのトランザクションでまとめて行う（途中で失敗したら全部巻き戻る）
    const result = await prisma.$transaction(async (tx) => {
      const article = await tx.company_interview_articles.upsert({
        where: { companyId },
        update: {
          title: body.title,
          introText: body.introText ?? null,
          status: body.status,
          publishedAt,
          updatedBy: admin.id,
        },
        create: {
          companyId,
          title: body.title,
          introText: body.introText ?? null,
          status: body.status,
          publishedAt,
          createdBy: admin.id,
          updatedBy: admin.id,
        },
      });

      // 簡易版: いったん全ブロック削除 → 入力があったセクションだけ text ブロックを作り直す
      await tx.company_interview_blocks.deleteMany({
        where: { articleId: article.id },
      });

      const blocks: {
        articleId: bigint;
        sectionKey: "company_intro" | "work_style";
        blockType: "text";
        textContent: string;
        displayOrder: number;
      }[] = [];

      if (body.companyIntroText && body.companyIntroText.trim() !== "") {
        blocks.push({
          articleId: article.id,
          sectionKey: "company_intro",
          blockType: "text",
          textContent: body.companyIntroText,
          displayOrder: 0,
        });
      }
      if (body.workStyleText && body.workStyleText.trim() !== "") {
        blocks.push({
          articleId: article.id,
          sectionKey: "work_style",
          blockType: "text",
          textContent: body.workStyleText,
          displayOrder: 0,
        });
      }
      if (blocks.length > 0) {
        await tx.company_interview_blocks.createMany({ data: blocks });
      }

      return article;
    });

    return NextResponse.json({ id: result.id.toString() });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
