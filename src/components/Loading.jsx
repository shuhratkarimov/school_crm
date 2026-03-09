import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const LottieLoading = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10">
      <div className="flex flex-col items-center justify-center">
        <DotLottieReact
          src="/animations/loading.lottie"
          autoplay={true}
          loop
          style={{
            width: 400,
            height: 400,
            display: "block",
            margin: "150px auto",
          }}
        />
      </div>
    </div>
  );
};

export default LottieLoading;
