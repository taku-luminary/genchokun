import type { CompanyCredentials } from "@/app/_types/companies";
import { getQualificationLabels } from "@/app/_constants/qualifications";

type Props = {
  credentials: CompanyCredentials;
};

// 公開企業ページの「施工体制・資格」カード。
// 企業ごとに見比べやすいよう、未入力の項目も「未記入」として同じ位置に表示する。
// ただし施工ID保有メーカーは業種によって関係のない企業が多いので、未入力なら見出しごと表示しない（入力不足に見せないため）
export function CompanyCredentialsCard({ credentials }: Props) {
  // 資格は定数の並び（業種順）の表示名に変換し、その他の資格・補足を最後に続ける
  const qualificationLines = getQualificationLabels(credentials.qualifications);
  if (credentials.qualificationsOther) {
    qualificationLines.push(credentials.qualificationsOther);
  }

  // Boolean は true / false / null の3状態。
  // false（加入なし・未登録）も発注判断の材料なので表示し、null（まだ選んでいない）だけ未記入にする
  let insuranceText: string | null = null;
  if (credentials.hasInsurance === true) {
    insuranceText = credentials.insuranceNote
      ? `加入あり\n${credentials.insuranceNote}`
      : "加入あり";
  } else if (credentials.hasInsurance === false) {
    insuranceText = "加入なし";
  }

  let invoiceText: string | null = null;
  if (credentials.isInvoiceRegistered === true) {
    invoiceText = "登録済み";
  } else if (credentials.isInvoiceRegistered === false) {
    invoiceText = "未登録";
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-base font-bold text-slate-700">施工体制・資格</p>
        <p className="text-xs text-slate-400">企業の自己申告による情報です</p>
      </div>

      <CredentialRow label="工事区分／経験年数" value={credentials.workExperience} />
      <CredentialRow
        label="保有資格・講習修了"
        value={qualificationLines.length > 0 ? qualificationLines.join("\n") : null}
      />
      <CredentialRow label="工事保険" value={insuranceText} />
      {credentials.installerIdManufacturers && (
        <CredentialRow label="施工ID保有メーカー" value={credentials.installerIdManufacturers} />
      )}
      <CredentialRow label="インボイス登録" value={invoiceText} />
    </div>
  );
}

// 5項目で同じ形（見出しの下に本文）にそろえ、空なら「未記入」を出す
function CredentialRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-sm font-bold text-slate-700 mb-1">{label}</p>
      {value ? (
        <p className="text-slate-700 whitespace-pre-wrap wrap-break-word">{value}</p>
      ) : (
        <p className="text-slate-400">未記入</p>
      )}
    </div>
  );
}
