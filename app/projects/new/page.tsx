"use client";

  import { useForm, Controller } from "react-hook-form";
  import { PrefectureSelect } from "@/app/_components/ui/PrefectureSelect";
  import { useRouter } from "next/navigation";
  import { Label } from "@/app/_components/ui/Label";
  import { Input } from "@/app/_components/ui/Input";
  import { Button } from "@/app/_components/ui/Button";
  import { RewardTypeField } from "@/app/_components/RewardTypeField";
  import type { CreateProjectRequest } from "@/app/_types/projects";  

  export default function NewProjectPage() {
    const router = useRouter();
    const {
      register,
      handleSubmit,
      control, // ← Controller に渡して、カスタム部品をRHFの管理下に置くための「接続口」
      setError,
      clearErrors,
      formState: { errors, isSubmitting },
    } = useForm<CreateProjectRequest>({ defaultValues: { rewardType: "fixed" } });
    // ===useForm<CreateProjectRequest>();の説明＝＝＝
    // →useFormが返す「道具セット」の中で、フォームの入力データに関係する部分だけがCreateProjectRequest を基準に型付けされる
    // このフォームでは、register("city") とか register("title") とか、CreateProjectRequest に存在する項目名を使います。
    // 送信時に handleSubmit が作る data も、CreateProjectRequest の形として扱います。
    // ただし、register や handleSubmit や isSubmitting 自体がCreateProjectRequest 型になるわけではありません。

    const createProject = async (data: CreateProjectRequest) => {
      // 前回のサーバーエラーをクリア (root.serverError は予約名 root の下位キー)
      clearErrors('root.serverError');
  
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
  
        if (!res.ok) {
          // エラー応答が JSON でない場合に備え、json() 失敗時は空オブジェクト扱いにする
          const json = await res.json().catch(() => ({}));
          setError('root.serverError', {
            type: 'server',
            message: json.error ?? "投稿に失敗しました",
          });
          return;
        }
        router.push("/mypage");
      } catch {
        // fetch 自体の失敗（オフライン・通信断など）をここで拾う
        setError('root.serverError', {
          type: 'server',
          message: "通信エラーが発生しました。時間をおいて再度お試しください。",
        });
      }
    };
  

    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-8 text-center">電気工事の案件投稿フォーム</h1>

        <form onSubmit={handleSubmit(createProject)}  className="space-y-5">
        {/*===handleSubmit(引数) の説明===
          handleSubmit(createProject) は、フォーム送信時に実行される関数」を作る。イメージとしては以下と同じ：
          const submitHandler = handleSubmit(createProject);
          <form onSubmit={submitHandler}>
          ===以下submitHandlerの中身のイメージ====
              ① ブラウザ標準のフォーム送信を止める
              通常のHTMLフォームは送信するとページ遷移・リロードするため
              event.preventDefault();

              ② register で登録された各入力欄の値を RHF 内部から集める
              const data = {
                prefectureId: formValues["prefectureId"],
                city: formValues["city"],
                title: formValues["title"],
                investigationSummary: formValues["investigationSummary"],
                investigationDetails: formValues["investigationDetails"],
                workStartDate: formValues["workStartDate"],
                workEndDate: formValues["workEndDate"],
                rewardYen: formValues["rewardYen"],
                paymentCycle: formValues["paymentCycle"],
              };

               ③ required などのバリデーションを確認する
                 例：prefectureId が空なら errors.prefectureId にエラーを入れる

               ④ エラーがなければ、完成した data を createProject に渡す
              createProject(data);  */}


            {/* 都道府県 */}

            <div>
              <Label htmlFor="prefectureId">都道府県 *</Label>

              {/* select の代わりに、エリア別モーダルで選ぶ PrefectureSelect を使う。
                  自作の入力部品は register では接続できない（register は input / select /
                  textarea などの HTML 要素専用）ため、代わりに Controller を使う。
                  Controller は「カスタム部品を React Hook Form につなぐ公式の部品」で、
                  render の中で field.value（現在値）と field.onChange（値の更新関数）を
                  受け取り、それを自作部品の props に渡す。 */}
              <Controller
                name="prefectureId"
                control={control}
                rules={{ required: "都道府県を選択してください" }}
                render={({ field }) => (
                  <PrefectureSelect
                    id="prefectureId"
                    value={field.value ?? null}  // 未選択（undefined）は null に変換して渡す
                    onChange={field.onChange}    // 県タップ時に number がそのままRHFに保存される
                    disabled={isSubmitting}
                  />
                )}
              />
              {/* valueAsNumber が不要になった理由:
                  select の value は必ず文字列なので数値への変換が必要だったが、
                  PrefectureSelect は onChange(p.id) で最初から number を渡すため。 */}

              {errors.prefectureId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.prefectureId.message}
                </p>
              )}
            </div>
          {/* 市区町村 */}
          <div>
            <Label htmlFor="city">市区町村</Label>
            <Input id="city" disabled={isSubmitting} placeholder="例：文京区" {...register("city")} />
              {/*===registerの説明=== 
                  ① 入力欄の名前をRHFに教える
                  ② 入力が変わったら内部ストアを更新する onChange を渡す
                  ③ blurしたことを記録する onBlur を渡す
                  ④ input要素そのものを覚える ref を渡す
                register("city") は、React Hook Form がこの入力欄を管理するための設定オブジェクトを返す。
                HTML/JSXのタグでは基本的に 属性=値 の形で書く。だから、JSのオブジェクトをそのまま置けない。
                JSX の中で {...オブジェクト} と書くと、オブジェクトの中身が props として展開される。
                つまり： <Input {...register("city")} /> は、イメージとしては以下と同じ：
                <Input
                  name: "city",
                  onChange: (event) => {
                    const value = event.target.value;
                    formValues["city"] = value;}, ← RHFの内部ストアに保存するイメージ
                  onBlur: () => {入力欄から離れたことを記録する}, ← 入力欄から離れたことをRHFが記録する、 バリデーションや touched 状態の管理に使われる
                  ref: (element) => {registeredFields["city"] = element;} ← このinput要素そのものをRHFが覚える。これにより、reset時に、registeredFields["city"].value = "文京区";のように、画面上のinputへ値を反映できる
                /> 

                ■役割
                  formValues → RHF内部の正式なフォームデータ置き場
                  formValues.name = ... → 保存時に使う内部データを更新する
                  registeredFields → 実際のinput/select/textarea要素の置き場
                  registeredFields.name.value = ... → 画面上のinputに表示する値を更新する
                  register → inputをRHFに接続し、onChangeで内部データを更新できるようにし、refでinput要素も覚えられるようにする
                */}
                {/*===event / target / value の説明===
                  onChange は、入力欄の中身が変わったときに実行される関数。
                  event は React が自動で渡してくれる「入力変更イベントの情報」。
                  event.target には、実際に変更された input 要素が入る。

                  例：<Input id="city" name="city" /> に「文京区」と入力した場合、

                  event.target はこの input 自体が入る、
                  event.target.value は "文京区" になる。

                  つまり、const value = event.target.value;は「今入力されている文字列を取り出す」という意味。
                */}
                {/*===["name"]と.nameの説明===
                  formValues["name"] と formValues.name は同じ。
                  でも、formValues[fieldName] と formValues.fieldName は違う。
                  fieldName が変数なら、必ず [] を使う。
                  [] は「この変数の中身をプロパティ名として使う」という意味。
                  . は「そのまま書いた名前をプロパティ名として使う」という意味。
                */}
          </div>

          {/* タイトル */}
          <div>
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              disabled={isSubmitting}
              placeholder="例：太陽光パネルの設置工事"
              {...register("title", { required: "タイトルを入力してください" })}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* 案件内容 */}
          <div>
            <Label htmlFor="investigationSummary">案件内容</Label>
            <textarea
              id="investigationSummary"
              disabled={isSubmitting}
              placeholder="例：創蓄の工事です。カナディアン・ソーラーの太陽光パネルと、ニチコン19.9kwの蓄電池の設置をお願いします。足場の手配、B材の調達、現地調査も相談したいです。"
              className="w-full min-h-32 border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
              rows={2}
              {...register("investigationSummary")}
            />
          </div>

          {/* メモ・備考 */}
          <div>
            <Label htmlFor="investigationDetails">メモ・備考</Label>
            <textarea
              id="investigationDetails"
              disabled={isSubmitting}
              placeholder="例：お客様宅には駐車場がないため、訪問時は近隣のコインパーキングをご利用ください。"
              className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
              rows={3}
              {...register("investigationDetails")}
            />
          </div>

          {/* 作業日程 */}
          {/* date入力はブラウザ固有の最小幅より縮まないため、スマホでは縦積みにする */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Label   htmlFor="workStartDate">作業開始日</Label>
              <Input id="workStartDate" disabled={isSubmitting} type="date"  {...register("workStartDate")} />
            </div>

            <div className="flex-1">
              <Label htmlFor="workEndDate">作業終了日</Label>
              <Input id="workEndDate" disabled={isSubmitting} type="date" {...register("workEndDate")} />
            </div>
          </div>

          {/* 報酬（決め方の選択＋金額入力。中身は RewardTypeField に集約） */}
          <RewardTypeField
            control={control}
            register={register}
            errors={errors}
            disabled={isSubmitting}
          />

          {/* 支払サイクル */}
          <div>
            <Label htmlFor="paymentCycle">支払サイクル</Label>
            <Input
              id="paymentCycle"
              disabled={isSubmitting}
              placeholder="例：人日発注"
              {...register("paymentCycle")}
            />
          </div>
          
          {/* サーバーエラー (root.serverError から参照) */}
          {errors.root?.serverError?.message && (
            <p className="text-red-500 text-sm">{errors.root.serverError.message}</p>
          )}

          {/* 送信ボタン */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "投稿中..." : "工事案件を投稿する"}
          </Button>
        </form>
      </div>
    );
  }