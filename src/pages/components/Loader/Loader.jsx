import React from 'react';

const LoadingWave = () => {
  return (
    <div className="container">
      <div className="loading-wave">
        <div className="loading-bar"></div>
        <div className="loading-bar"></div>
        <div className="loading-bar"></div>
        <div className="loading-bar"></div>
      </div>

      <style jsx>{`
        .container {
          display: flex;
          height: 100vh;
          width: 100%;
          justify-content: center;
          align-items: center;
        }

        .loading-wave {
          width: 300px;
          height: 100px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        .loading-bar {
          width: 20px;
          height: 10px;
          margin: 0 5px;
          background-color: #7C5832;
          border-radius: 5px;
          animation: loading-wave-animation 1s ease-in-out infinite;
        }

        .loading-bar:nth-child(2) {
          animation-delay: 0.1s;
        }

        .loading-bar:nth-child(3) {
          animation-delay: 0.2s;
        }

        .loading-bar:nth-child(4) {
          animation-delay: 0.3s;
        }

        @keyframes loading-wave-animation {
          0% {
            height: 10px;
          }

          50% {
            height: 50px;
          }

          100% {
            height: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingWave;
