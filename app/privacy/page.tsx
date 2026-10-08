import type { Metadata } from "next";
import { LegalDocument } from "@/app/_components/LegalDocument";
import { PRIVACY_POLICY } from "@/app/_constants/legal/privacy";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 電工くん",
  description:
    "電工くんが取得する個人情報の利用目的、公開範囲、安全管理措置、開示等のご請求方法についてご案内します。",
};

export default function PrivacyPage() {
  return <LegalDocument document={PRIVACY_POLICY} />;
}
