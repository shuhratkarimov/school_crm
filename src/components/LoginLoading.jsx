import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LoginLoading = () => {
  return (
    <div>
      <DotLottieReact
        src="/animations/loginLoading.lottie"
        autoplay={true}
        loop
        style={{
          width: 32,
          height: 32,
          display: "block"
        }}
      />
    </div>
  );
};

export default LoginLoading;