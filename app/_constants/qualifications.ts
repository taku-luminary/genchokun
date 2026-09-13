// 保有資格・講習修了の選択肢。
// フォームの折りたたみ・チップ、企業ページの表示名、API の入力チェックがすべてこのファイルを参照する。
//
// DB には label ではなく value（コード）を保存しているので、変更するときは次のルールを守る。
// - 増やす       : 1行追加する。value は英字で、一度決めたら変えない
// - 名前を変える : label だけ書き換える（保存済みのデータはそのまま使える）
// - 並び順       : 行の順番を入れ替える（企業ページの表示順もこの順になる）
// - 業種を移す   : category を書き換える
// - 減らす       : 行は消さず isActive: false にする。新しく選べなくなるが、保有済みの企業には表示し続ける。
//                  行を消すのは、DB にそのコードを持つ企業がいなくなってから

// 折りたたみの見出しと、その並び順
export const QUALIFICATION_CATEGORIES = [
  { key: "electrical", label: "電気" },
  { key: "scaffolding", label: "足場・とび" },
  { key: "waterproofing", label: "防水" },
  { key: "painting", label: "塗装" },
  { key: "building_management", label: "建築施工管理" },
] as const;

// "electrical" | "scaffolding" | ... のように、上の key だけを許す型
export type QualificationCategoryKey =
  (typeof QUALIFICATION_CATEGORIES)[number]["key"];

type QualificationOption = {
  value: string;
  label: string;
  category: QualificationCategoryKey;
  isActive: boolean;
};

// value には業種を含める（電気と建築の「施工管理技士」を取り違えないため）
export const QUALIFICATIONS: readonly QualificationOption[] = [
  // 電気
  { value: "electrician_1", label: "第一種電気工事士", category: "electrical", isActive: true },
  { value: "electrician_2", label: "第二種電気工事士", category: "electrical", isActive: true },
  { value: "electrical_construction_manager_1", label: "1級電気工事施工管理技士", category: "electrical", isActive: true },
  { value: "electrical_construction_manager_2", label: "2級電気工事施工管理技士", category: "electrical", isActive: true },
  { value: "electrical_certified_worker", label: "認定電気工事従事者", category: "electrical", isActive: true },
  { value: "chief_electrical_engineer_3", label: "第三種電気主任技術者", category: "electrical", isActive: true },

  // 足場・とび
  { value: "tobi_skill_1", label: "1級とび技能士", category: "scaffolding", isActive: true },
  { value: "tobi_skill_2", label: "2級とび技能士", category: "scaffolding", isActive: true },
  { value: "scaffolding_chief_course", label: "足場の組立て等作業主任者技能講習修了", category: "scaffolding", isActive: true },

  // 防水（作業区分は「その他の資格・講習／補足」に書いてもらう）
  { value: "waterproofing_skill_1", label: "1級防水施工技能士", category: "waterproofing", isActive: true },
  { value: "waterproofing_skill_2", label: "2級防水施工技能士", category: "waterproofing", isActive: true },

  // 塗装（建築以外の作業区分もあるため、作業名まで表示する）
  { value: "painting_skill_1_building", label: "1級塗装技能士（建築塗装作業）", category: "painting", isActive: true },
  { value: "painting_skill_2_building", label: "2級塗装技能士（建築塗装作業）", category: "painting", isActive: true },

  // 建築施工管理（2級は種別ごとに対象が異なるため分ける）
  { value: "building_construction_manager_1", label: "1級建築施工管理技士", category: "building_management", isActive: true },
  { value: "building_construction_manager_2_building", label: "2級建築施工管理技士（建築）", category: "building_management", isActive: true },
  { value: "building_construction_manager_2_framework", label: "2級建築施工管理技士（躯体）", category: "building_management", isActive: true },
  { value: "building_construction_manager_2_finishing", label: "2級建築施工管理技士（仕上げ）", category: "building_management", isActive: true },
];

// API の入力チェック用。isActive: false の資格も、定数に存在するコードなら保存を許可する
// （一覧から外した資格を持つ企業が、別の項目を直して保存したときに 400 にならないように）
export function isQualificationCode(value: unknown): value is string {
  return typeof value === "string" && QUALIFICATIONS.some((q) => q.value === value);
}

// 保存済みのコードを表示名に変換する。
// チェックした順ではなく、この定数の並び（業種順）で返すので、どの企業でも表示順が揃う
export function getQualificationLabels(codes: string[]): string[] {
  return QUALIFICATIONS.filter((q) => codes.includes(q.value)).map((q) => q.label);
}
