import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const LoginAnimation = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10">
      <div className="flex flex-col items-center justify-center">
        <DotLottieReact
          src="/animations/Login.lottie"
          autoplay={true}
          loop
          style={{
            width: 300,
            height: 300,
            display: "block",
            margin: "150px auto",
          }}
        />
      </div>
    </div>
  );
};

export default LoginAnimation;
