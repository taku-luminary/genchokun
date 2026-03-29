export function HeroBackground() {
  return (
    <>
      <div
        className="absolute top-[-140px] left-[-110px] w-[360px] md:w-[540px] aspect-square rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(161, 214, 174, 0.38) 0%, rgba(145, 201, 160, 0.30) 100%)',
          border: '1px solid rgba(188, 229, 198, 0.24)',
          boxShadow: '0 0 0 1px rgba(150, 205, 165, 0.05) inset',
        }}
      />

      <div
        className="absolute top-[6%] right-[-90px] w-[300px] md:w-[450px] aspect-square rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(156, 210, 171, 0.34) 0%, rgba(141, 196, 157, 0.27) 100%)',
          border: '1px solid rgba(184, 226, 194, 0.22)',
          boxShadow: '0 0 0 1px rgba(145, 200, 160, 0.04) inset',
        }}
      />

      <div
        className="absolute bottom-[-130px] left-[6%] w-[250px] md:w-[360px] aspect-square rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(166, 216, 178, 0.32) 0%, rgba(148, 200, 161, 0.25) 100%)',
          border: '1px solid rgba(190, 230, 200, 0.21)',
          boxShadow: '0 0 0 1px rgba(152, 206, 167, 0.04) inset',
        }}
      />

      <div
        className="absolute top-[34%] left-[28%] w-[130px] md:w-[190px] aspect-square rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(158, 210, 172, 0.27) 0%, rgba(142, 194, 156, 0.21) 100%)',
          border: '1px solid rgba(184, 224, 193, 0.18)',
          boxShadow: '0 0 0 1px rgba(145, 198, 159, 0.03) inset',
        }}
      />

      <div
        className="absolute top-[20%] left-[12%] w-[90px] md:w-[130px] aspect-square rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(164, 214, 177, 0.24) 0%, rgba(146, 198, 160, 0.18) 100%)',
          border: '1px solid rgba(186, 225, 195, 0.16)',
          boxShadow: '0 0 0 1px rgba(146, 198, 160, 0.025) inset',
        }}
      />

      <div
        className="absolute bottom-[14%] right-[14%] w-[105px] md:w-[150px] aspect-square rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(160, 211, 173, 0.25) 0%, rgba(143, 195, 157, 0.19) 100%)',
          border: '1px solid rgba(182, 222, 191, 0.16)',
          boxShadow: '0 0 0 1px rgba(143, 196, 158, 0.025) inset',
        }}
      />
    </>
  );
}