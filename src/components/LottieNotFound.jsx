import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LottieNotFound = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10">
        <p style={{textAlign: "center", fontSize: "25px", marginTop: "150px"}}>Siz qidirgan sahifa topilmadi yoki hali amalda emas... {":("}</p>
      <div className="flex flex-col items-center justify-center">
      <DotLottieReact
        src="/animations/not-found.lottie"
        autoplay={true}
        loop
        style={{
          width: 400,
          height: 400,
          display: "block",
          margin: "0 auto",
        }}
      />
    </div>
  </div>
  );
};

export default LottieNotFound;
