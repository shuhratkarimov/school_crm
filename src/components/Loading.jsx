import { createPortal } from "react-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const LottieLoading = () => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm">
      <DotLottieReact
        src="/animations/loading.lottie"
        autoplay={true}
        loop
        style={{
          width: "min(80vw, 400px)",
          height: "min(80vw, 400px)",
          background: "transparent",
        }}
      />
    </div>,
    document.body
  );
};

export default LottieLoading;
