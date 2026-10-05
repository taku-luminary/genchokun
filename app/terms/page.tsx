import type { Metadata } from "next";
import { LegalDocument } from "@/app/_components/LegalDocument";
import { TERMS } from "@/app/_constants/legal/terms";

export const metadata: Metadata = {
  title: "利用規約 | 電工くん",
  description: "電気工事・調査のマッチングサービス「電工くん」の利用規約です。",
};

export default function TermsPage() {
  return <LegalDocument document={TERMS} />;
}
