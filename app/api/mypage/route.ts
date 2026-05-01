import { NextResponse } from "next/server";                                                                                                         
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";                                                                                              
import type { MypageApiResponse } from "@/app/_types/mypage";
                                                                                                                                                    
export async function GET(): Promise<NextResponse<MypageApiResponse>> {
  const user = await getAuthUser();                                                                                                                 
  if (!user) {                                                                                                                                      
    return NextResponse.json({ error: "ログインが必要です" } as never, { status: 401 });
  }                                                                                                                                                 
                                 
  const [projectCount, applicationCount, todoCount, projects, requests] = await Promise.all([                                                       
    prisma.projects.count({      
      where: { salesUserId: user.id, deleted_at: null },                                                                                            
    }),
    prisma.matches.count({                                                                                                                          
      where: { contractorUserId: user.id },
    }),                                                                                                                                             
    prisma.matches.count({       
      where: { salesUserId: user.id, status: "pending" },
    }),                                                                                                                                             
    prisma.projects.findMany({
      where: { salesUserId: user.id, deleted_at: null },                                                                                            
      include: { prefecture: true, matches: true },                                                                                                 
      orderBy: { created_at: "desc" },
    }),                                                                                                                                             
    prisma.requests.findMany({   
      where: { contractorUserId: user.id, deleted_at: null },                                                                                       
      include: { prefecture: true, match: true },
      orderBy: { created_at: "desc" },                                                                                                              
    }),
  ]);                                                                                                                                               
                                 
  const response: MypageApiResponse = {
    stats: { projectCount, applicationCount, todoCount },
    projects: projects.map((p) => ({
      id: p.id.toString(),                                                                                                                          
      created_at: p.created_at.toISOString(),
      prefecture: { name: p.prefecture.name },                                                                                                      
      city: p.city,                                                                                                                                 
      workStartDate: p.workStartDate?.toISOString() ?? null,
      workEndDate: p.workEndDate?.toISOString() ?? null,                                                                                            
      investigationSummary: p.investigationSummary,
      paymentCycle: p.paymentCycle,                                                                                                                 
      rewardYen: p.rewardYen === null ? null : Number(p.rewardYen),                                                                                 
      status: p.status,
      matches: p.matches.map((m) => ({ status: m.status })),                                                                                        
    })),                                                                                                                                            
    requests: requests.map((r) => ({
      id: r.id.toString(),                                                                                                                          
      created_at: r.created_at.toISOString(),
      prefecture: { name: r.prefecture.name },                                                                                                      
      city: r.city,              
      availableStartDate: r.availableStartDate?.toISOString() ?? null,
      availableEndDate: r.availableEndDate?.toISOString() ?? null,                                                                                  
      investigationSummary: r.investigationSummary,
      paymentCycle: r.paymentCycle,                                                                                                                 
      rewardMinYen: r.rewardMinYen === null ? null : Number(r.rewardMinYen),
      status: r.status,                                                                                                                             
      match: r.match ? { status: r.match.status } : null,
    })),                                                                                                                                            
  };                             

  return NextResponse.json(response);
}