import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Error = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10">
        {/* <p style={{textAlign: "center", fontSize: "25px", marginTop: "150px"}}>Siz qidirgan sahifa topilmadi yoki hali amalda emas... {":("}</p> */}
      <div className="flex flex-col items-center justify-center">
      <DotLottieReact
        src="/animations/Error.lottie"
        autoplay={true}
        loop
        style={{
          width: 400,
          height: 400,
          display: "block",
          margin: "100px auto",
        }}
      />
    </div>
  </div>
  );
};

export default Error;
