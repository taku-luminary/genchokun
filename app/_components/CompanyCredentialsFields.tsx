"use client";

import { Controller, useWatch } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Textarea } from "@/app/_components/ui/Textarea";
import { CheckboxChip } from "@/app/_components/ui/CheckboxChip";
import { BooleanRadio } from "@/app/_components/ui/BooleanRadio";
import { QUALIFICATION_CATEGORIES, QUALIFICATIONS } from "@/app/_constants/qualifications";
import { CREDENTIAL_TEXT_MAX_LENGTH } from "@/app/_constants/companyCredentials";
import type { UpdateCompanyRequest } from "@/app/_types/companies";

type Props = {
  control: Control<UpdateCompanyRequest>;
  register: UseFormRegister<UpdateCompanyRequest>;
  // DB に保存済みの資格コード。一覧から外した資格（isActive: false）を保有企業にだけ出すことと、
  // 最初から開いておく業種の判定に使う
  savedQualifications: string[];
  disabled?: boolean;
};

// 自社情報フォームの「施工体制・資格（任意）」セクション。
// 企業ページで公開される情報なので、非公開の連絡先とは見出しと説明で区別する
export function CompanyCredentialsFields({ control, register, savedQualifications, disabled }: Props) {
  // チェック状態と保険の選択だけを監視する。
  // useWatch はこの部品だけを再描画するので、チェックのたびにページ全体が再描画されない
  const selectedQualifications = useWatch({ control, name: "qualifications" }) ?? [];
  const hasInsurance = useWatch({ control, name: "hasInsurance" });

  return (
    <div className="space-y-5 border-t-2 border-slate-200 pt-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">施工体制・資格（任意）</h2>
        <p className="text-xs text-brand-green mt-1">
          こちらは企業ページに公開され、相手企業が依頼先を検討する際の判断材料になります。<br />
          記載すると貴社の情報が伝わり、マッチングにつながりやすくなります。
        </p>
      </div>

      {/* 工事区分／経験年数 */}
      <div>
        <Label htmlFor="workExperience">工事区分／経験年数</Label>
        <p className="text-xs text-slate-500 mb-2">1行に1つ、「工事区分：年数（請負／人工）」の形で書いてください</p>
        <Textarea
          id="workExperience"
          rows={4}
          maxLength={CREDENTIAL_TEXT_MAX_LENGTH}
          disabled={disabled}
          placeholder={"例：\n・太陽光パネル：10年（請負として）\n・蓄電池：3年（人工として）\n・塗装：2年（請負として）"}
          {...register("workExperience")}
        />
      </div>

      {/* 保有資格・講習修了 */}
      <div>
        <Label>保有資格・講習修了</Label>
        <p className="text-xs text-slate-500 mb-2">
          代表者・自社スタッフが保有する資格や修了した講習を選択してください。業種をタップすると開きます（複数の業種から選べます）
        </p>
        <div className="rounded-xl border-2 border-slate-200 divide-y divide-slate-200 overflow-hidden">
          {QUALIFICATION_CATEGORIES.map((category) => {
            // 一覧から外した資格は、すでに保有登録している企業にだけ出す（次の保存で勝手に消えないように）
            const options = QUALIFICATIONS.filter(
              (q) =>
                q.category === category.key &&
                (q.isActive || savedQualifications.includes(q.value))
            );
            if (options.length === 0) return null;

            const selectedCount = options.filter((q) =>
              selectedQualifications.includes(q.value)
            ).length;
            // 保存済みの資格がある業種は、画面を開いた時点で開いておく
            const hasSaved = options.some((q) => savedQualifications.includes(q.value));

            return (
              // details / summary はブラウザ標準の折りたたみ。開閉の状態を useState で持たなくてよい。
              // 閉じていても中のチェックボックスは画面に残っているので、選んだ値は保持されて送信される
              <details key={category.key} open={hasSaved} className="group/category bg-white">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="text-xs text-slate-400 transition group-open/category:rotate-90">
                    ▶
                  </span>
                  <span>{category.label}</span>
                  {/* 閉じていても何件選んだか分かるように、見出しに件数を出す */}
                  {selectedCount > 0 && (
                    <span className="ml-auto text-xs text-brand-green">{selectedCount}件選択中</span>
                  )}
                </summary>
                <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
                  {options.map((q) => (
                    <CheckboxChip
                      key={q.value}
                      label={q.label}
                      value={q.value}
                      disabled={disabled}
                      {...register("qualifications")}
                    />
                  ))}
                </div>
              </details>
            );
          })}
        </div>

        <div className="mt-4">
          <Label htmlFor="qualificationsOther">その他の資格・講習／補足</Label>
          <Textarea
            id="qualificationsOther"
            rows={4}
            maxLength={CREDENTIAL_TEXT_MAX_LENGTH}
            disabled={disabled}
            placeholder={"例：\n消防設備士 乙種4類\n防水施工技能士の作業区分：ウレタンゴム系塗膜防水"}
            {...register("qualificationsOther")}
          />
        </div>
      </div>

      {/* 工事保険 */}
      <div>
        <Label>工事保険</Label>
        {/* ラジオの値は HTML では文字列になるため、boolean で扱える BooleanRadio を Controller で接続する */}
        <Controller
          name="hasInsurance"
          control={control}
          render={({ field }) => (
            <BooleanRadio
              name={field.name}
              value={field.value ?? null}
              onChange={field.onChange}
              yesLabel="加入あり"
              noLabel="加入なし"
              disabled={disabled}
            />
          )}
        />
        {/* 保険の内容は「加入あり」のときだけ入力する。加入なしで保存すると API 側で消える */}
        {hasInsurance === true && (
          <div className="mt-2 border-l-4 border-brand-bg pl-3">
            <Label htmlFor="insuranceNote">保険の内容</Label>
            <Textarea
              id="insuranceNote"
              rows={3}
              maxLength={CREDENTIAL_TEXT_MAX_LENGTH}
              disabled={disabled}
              placeholder="例：請負業者賠償責任保険（対人・対物 1億円）"
              {...register("insuranceNote")}
            />
          </div>
        )}
      </div>

      {/* 施工ID・メーカー認定 */}
      <div>
        <Label htmlFor="manufacturerCertifications">施工ID・メーカー認定</Label>
        <p className="text-xs text-slate-500 mb-2">
        保有している施工IDやメーカー認定がある場合に入力してください。1行に1件、メーカー名と対象の製品を記載してください。ID・認定番号は入力しないでください。
        </p>
        <Textarea
          id="manufacturerCertifications"
          rows={4}
          maxLength={CREDENTIAL_TEXT_MAX_LENGTH}
          disabled={disabled}
          placeholder={"例：\n・所有している施工ID\n   パナソニック（太陽光パネル）\n   ニチコン（蓄電池）\n   長州産業（太陽光パネル・蓄電池）"}
          {...register("manufacturerCertifications")}
        />
      </div>

      {/* インボイス登録 */}
      <div>
        <Label>インボイス登録</Label>
        <Controller
          name="isInvoiceRegistered"
          control={control}
          render={({ field }) => (
            <BooleanRadio
              name={field.name}
              value={field.value ?? null}
              onChange={field.onChange}
              yesLabel="登録済み"
              noLabel="未登録"
              disabled={disabled}
            />
          )}
        />
      </div>
    </div>
  );
}
