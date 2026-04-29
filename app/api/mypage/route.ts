import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";                                                                                              
import type { MypageApiResponse } from "@/app/_types/mypage";
                                                                                                                                                    
// BigInt を JSON に変換するヘルパー                                                                                                                
function toJson(data: unknown) {
  return JSON.parse(                                                                                                                                
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );                                                                                                                                                
}
                                                                                                                                                    
export async function GET(): Promise<NextResponse<MypageApiResponse>> {
  const user = await getAuthUser();
                                                                                                                                                    
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" } as never, { status: 401 });                                                            
  }                              

  // 5つのDBクエリを並列実行（Promise.all に配列で渡す）                                                                                            
  const [projectCount, applicationCount, todoCount, projects, requests] = await Promise.all([
    prisma.projects.count({                          // ① projectCount                                                                              
      where: { salesUserId: user.id, deleted_at: null },
    }),                                                                                                                                             
    prisma.matches.count({                           // ② applicationCount
      where: { contractorUserId: user.id },                                                                                                         
    }),                          
    prisma.matches.count({                           // ③ todoCount
      where: { salesUserId: user.id, status: "pending" },                                                                                           
    }),
    prisma.projects.findMany({                       // ④ projects                                                                                  
      where: { salesUserId: user.id, deleted_at: null },
      include: { prefecture: true, matches: true },                                                                                                 
      orderBy: { created_at: "desc" },
    }),                                                                                                                                             
    prisma.requests.findMany({                       // ⑤ requests
      where: { contractorUserId: user.id, deleted_at: null },                                                                                       
      include: { prefecture: true, match: true },
      orderBy: { created_at: "desc" },                                                                                                              
    }),                          
  ]);    
    // 5つの非同期処理を直列する場合
    // // 統計数値を取得
    // const projectCount = await prisma.projects.count({
    //   where: { salesUserId: user.id, deleted_at: null },
    // });
    // const applicationCount = await prisma.matches.count({
    //   where: { contractorUserId: user.id },
    // });
    // const todoCount = await prisma.matches.count({
    //   where: { salesUserId: user.id, status: "pending" },
    // });

    // // 掲載した工事案件を取得
    // const projects = await prisma.projects.findMany({
    //   where: { salesUserId: user.id, deleted_at: null },
    //   include: { prefecture: true, matches: true },
    //   orderBy: { created_at: "desc" },
    // });

    // // 掲載した工事店依頼を取得
    // const requests = await prisma.requests.findMany({
    //   where: { contractorUserId: user.id, deleted_at: null },
    //   include: { prefecture: true, match: true },
    //   orderBy: { created_at: "desc" },
    // });

    
    // レスポンスデータをまとめる                                                                                                                     
    const data = {                 
      stats: { projectCount, applicationCount, todoCount },
      projects,                                                                                                                                       
      requests,
    };                                                                                                                                                
                                   
    // toJson で BigInt を文字列に変換してから返す                                                                                                    
    return NextResponse.json(toJson(data));
  }         