# MuseumPapa-Customer

C 端(用户侧)移动 H5。**未来单独入仓**(每个前端独立仓库)。
栈:Vite + React + TS + Tailwind + HeroUI。

## 启动

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产出 dist/,可部署 Vercel
```

## 运行素材(public/data · public/img · public/fonts/*.woff2)

**已入库**(Vercel 以本目录为 Root 部署,自包含;随 git 持久)。需要刷新数据/图片时,
在主仓根目录重跑下面的 sync(数据以 `coupon-map/public/data` 为准 —— 它携带更全的
来源佐证与更对题的头图,是认定的准数据源):

```bash
cp coupon-map/public/data/{libraries,attractions,passes,branches}.json MuseumPapa-Customer/public/data/
cp data/static/images/*.{jpg,png}                                       MuseumPapa-Customer/public/img/
cp design-seed/customer-ui/fonts/*.woff2                                MuseumPapa-Customer/public/fonts/
```

> P1 用静态数据快照;实时库存(`/api/availability`)留到 P2。
> Vercel 部署: Root Directory = `MuseumPapa-Customer`,`vercel.json` 已配 vite + SPA rewrite。

## 结构

- `src/lib/supply.ts` —— 供应引擎:个性化(只我的卡)、去重、Email 优势隐藏、近/便宜取舍、排序
- `src/lib/data.ts` · `distance.ts` —— 数据加载 / 直线距离
- `src/store/wallet.ts` —— 持卡 + ZIP(localStorage,默认运营方 6 张卡)
- `src/pages/Home.tsx` · `Profile.tsx` —— 两个主面
- `src/components/` —— AttractionCard / SupplyRow / DateStrip / BookSheet

## 设计依据

暖色亲和、Fraunces+Inter;优惠=标签、不写 %、划线成人价做营销锚;详见主仓 `design-seed/`。
