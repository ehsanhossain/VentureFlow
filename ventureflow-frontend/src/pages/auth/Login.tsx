import React, { useState, useContext, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import coverImage from '../../assets/image/cover.svg';
import { AuthContext } from '../../routes/AuthContext';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../../components/Alert';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const auth = useContext(AuthContext);
  const login = auth?.login;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showAlert({ type: 'error', message: 'Please enter both email and password.' });
      return;
    }

    setLoading(true);

    try {
      if (!login) {
        showAlert({ type: 'error', message: 'Authentication service not available.' });
        setLoading(false);
        return;
      }
      const res = await login({ email, password, remember: rememberMe }) as any;

      setLoading(false);

      if (res.data.user.must_change_password) {
        navigate('/change-password');
        return;
      }

      showAlert({ type: 'success', message: 'Login successful!' });

      const intendedUrl = localStorage.getItem('intended_url') || '/dashboard';
      localStorage.removeItem('intended_url');

      navigate(intendedUrl);
    } catch {
      showAlert({ type: "error", message: "Login failed" });

      setLoading(false);

    }
  };

  return (
    <div className="flex min-h-screen w-screen flex-col md:flex-row overflow-hidden bg-white">
      <div className="flex flex-row flex-1 h-full overflow-hidden bg-white">


        <div className="hidden md:flex flex-col md:w-2/3 w-full justify-center items-start bg-white overflow-hidden relative h-[97vh] pr-2 pl-[15px] pt-[20px] rounded-[20px]">
          <img
            src={coverImage}
            alt="Venture Flow Cover Login"
            className="w-full h-full object-cover rounded-[20px]"
          />
        </div>

        <div className="flex flex-col justify-center items-center px-6 sm:px-12 py-6 bg-white w-full md:w-1/3 shadow-md mt-20 pt-10">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="47"
              height="28"
              viewBox="0 0 47 28"
              fill="none"
            >
              <path
                d="M43.8442 6.337C41.1602 2.59418 34.8952 -0.0456423 30.4171 1.47649C29.9465 1.63826 29.042 2.2706 29.042 2.80739V5.60903C30.2259 4.60899 32.3216 4.40308 32.3216 4.40308C37.1012 4.07954 41.3808 6.7488 42.7338 11.4034C45.3516 20.4333 36.513 27.7571 28.1743 23.0731C26.108 21.9113 22.9829 19.1611 21.1887 17.0802C20.0489 15.8669 18.4606 14.1461 17.3944 12.8961L16.7032 12.1388H19.8577C19.8357 11.9917 19.5783 10.2563 18.4018 8.95473H11.8721C11.5485 8.95473 10.7617 9.91802 10.7617 10.2563V16.5434C11.9162 17.639 13.4677 17.9772 13.9163 18.0581V14.3667C13.9163 14.3667 13.9678 14.3595 13.9898 14.3595L14.9531 15.2713C16.0046 16.4257 17.262 17.6831 18.2474 18.7052V18.6905C21.9976 22.4848 25.9904 27.0218 31.623 27.7424C43.4986 29.2646 50.6092 15.7639 43.8515 6.35172L43.8442 6.337Z"
                fill="#064771"
              />
              <path
                d="M29.1729 6.96282C29.092 6.94811 29.0479 6.94074 29.0479 6.94074V10.2792C28.0405 9.25705 27.011 8.18347 25.9448 7.14665C23.0329 4.32299 19.4739 1.47723 15.3634 0.947789C3.49518 -0.566989 -3.65957 12.9925 3.13487 22.3386C5.80411 26.0152 12.2309 28.8315 16.6355 27.177C17.0841 27.0079 17.937 26.3828 17.937 25.8681V23.3165C16.7017 22.5297 15.4663 21.5297 14.6575 20.8458V24.2799C9.87784 24.6108 5.59087 21.9268 4.24521 17.2795C1.62744 8.24967 10.4661 0.925794 18.8047 5.60984C20.1063 6.33782 22.1431 7.97754 23.6873 9.41143C23.6873 9.41143 23.7241 9.44825 23.7461 9.46296C24.9227 10.5586 25.9962 11.6837 26.6948 12.5955C26.7683 12.6911 26.7684 12.7205 26.8419 12.8823H23.2461C23.2682 13.0293 23.5255 14.7647 24.7021 16.0662H31.2318C31.5553 16.0662 32.3421 15.1029 32.3421 14.7647V8.47764C31.1877 7.382 29.6361 7.04371 29.1876 6.96282H29.1729Z"
                fill="#064771"
              />
            </svg>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="156"
              height="23"
              viewBox="0 0 156 23"
              fill="none"
            >
              <path
                d="M10.8247 15.3167L17.1779 0.404297H20.7884L10.9938 22.2877H10.6188L0.824219 0.404297H4.36115L10.8173 15.3167H10.8247Z"
                fill="#064771"
              />
              <path
                d="M22.7442 15.1779C22.7442 17.8912 24.7369 19.2662 27.2076 19.2662C29.2004 19.2662 30.3034 18.4059 30.921 17.8912L32.502 20.2296C30.649 21.5385 29.1709 21.9502 27.2076 21.9502C22.4647 21.9502 19.6484 19.0678 19.6484 14.5308C19.6484 9.99379 22.6045 7.11133 26.5238 7.11133C30.1342 7.11133 32.9799 9.55264 32.9799 13.744C32.9799 14.3985 32.9138 15.1852 32.9138 15.1852H22.7442V15.1779ZM22.9206 12.7366H30.1342C29.9283 10.6777 28.4136 9.64082 26.5973 9.64082C24.9134 9.64082 23.4721 10.6703 22.9206 12.7366Z"
                fill="#064771"
              />
              <path
                d="M46.0085 21.7066V14.2503C46.0085 11.1913 45.1849 9.7501 42.9128 9.7501C40.6406 9.7501 39.17 11.809 39.17 14.4194V21.7066H36.0742V7.34556H39.17V9.44123C40.0303 7.99999 41.6407 7.13965 43.4275 7.13965C47.5159 7.13965 49.1631 9.7133 49.1631 14.2209V21.7139H46.0012L46.0085 21.7066Z"
                fill="#064771"
              />
              <path
                d="M59.4076 21.8767H57.8266C54.2529 21.8767 53.0543 20.1928 53.0543 16.3103V9.92025H50.5469L51.2307 7.3466H53.0543V4.46417L56.1795 3.78027V7.35396H59.7532V9.92761H56.1795V16.3838C56.1795 19.0604 56.8339 19.4796 60.0253 19.2369L59.4076 21.8841V21.8767Z"
                fill="#064771"
              />
              <path
                d="M65.5916 7.34473V14.8378C65.5916 17.8967 66.1431 19.3012 68.5844 19.3012C71.0257 19.3012 72.2243 17.2423 72.2243 14.6319V7.34473H75.32V21.7057H72.2243V19.6101C71.3639 21.0513 69.9889 21.9116 67.9961 21.9116C63.9445 21.9116 62.4297 19.3673 62.4297 14.8671V7.34473H65.5916Z"
                fill="#064771"
              />
              <path
                d="M85.9029 9.91882C82.638 9.91882 82.1895 12.4631 82.1895 15.4853V21.7062H79.0938V7.34517H82.1895V9.50708C82.6674 7.9923 84.219 7.10254 85.8294 7.10254C86.1382 7.10254 86.3441 7.10249 86.6529 7.13925C86.447 8.1393 86.3809 8.92612 86.1382 9.91882H85.8955H85.9029Z"
                fill="#064771"
              />
              <path
                d="M128.337 21.4594C124.476 21.4594 121.344 18.9887 121.344 14.6208C121.344 10.253 124.476 7.78223 128.337 7.78223C132.197 7.78223 135.3 10.2824 135.3 14.6503C135.3 19.0181 132.227 21.4594 128.337 21.4594ZM128.3 10.6279C126.403 10.6279 124.785 12.0839 124.785 14.6135C124.785 17.143 126.403 18.599 128.3 18.599C130.293 18.599 131.815 17.2092 131.815 14.6429C131.815 12.0766 130.293 10.6207 128.3 10.6207V10.6279Z"
                fill="#064771"
              />
              <path
                d="M141.374 15.1879L144.668 7.8125H145.271L148.595 15.1879L151.669 8.00369H155.5L148.852 21.4603H148.286L144.992 13.9893L141.697 21.4603H141.095L134.477 8.00369H138.278L141.381 15.1879H141.374Z"
                fill="#064771"
              />
              <path d="M116.527 6.45688V21.237H120.005V4.89062L116.527 6.45688Z" fill="#064771" />
              <path
                d="M115.83 4.67616V1.60254H104.844V12.9486V13.0295V16.3385V16.9415V21.2358H108.77V12.081H113.675V8.98518H108.77V4.67616H115.83Z"
                fill="#064771"
              />
              <path
                d="M94.5332 19.3772C93.7537 19.3037 93.0846 19.0684 92.5625 18.8037C92.8419 18.9581 93.1655 19.1051 93.5405 19.2154C93.9743 19.3478 94.3787 19.3993 94.7538 19.4214C94.7538 19.4214 94.7538 19.4214 94.7685 19.4214C94.8641 19.4214 94.9964 19.4213 95.1288 19.3993C94.9303 19.3993 94.7317 19.3993 94.5258 19.3846L94.5332 19.3772Z"
                fill="#064771"
              />
              <path
                d="M92.5641 18.8035C92.3803 18.7153 92.2112 18.605 92.0494 18.4873H92.0273C92.1818 18.5903 92.3656 18.7006 92.5641 18.8035Z"
                fill="#064771"
              />
              <path
                d="M94.7636 19.4205C94.7636 19.4205 94.7636 19.4205 94.7783 19.4205C94.8298 19.4205 94.8886 19.4205 94.9548 19.4205C94.5136 19.4205 94.1239 19.3616 93.793 19.2881C94.1312 19.369 94.4621 19.4131 94.7636 19.4278V19.4205Z"
                fill="#064771"
              />
              <path
                d="M93.7925 19.2815C93.7116 19.2594 93.6308 19.2447 93.5425 19.2153C93.4249 19.1786 93.3072 19.1418 93.1969 19.0977H93.1602C93.3293 19.1638 93.5425 19.2227 93.7852 19.2815H93.7925Z"
                fill="#064771"
              />
              <path
                d="M102.499 14.1782C102.477 14.1929 102.455 14.2075 102.425 14.2222C101.918 14.5752 101.506 14.9576 101.168 15.3106C100.829 15.6635 100.572 15.9944 100.381 16.2665C100.146 16.6415 99.6235 17.3916 98.7264 18.0534C98.7264 18.0534 98.6897 18.0754 98.675 18.0901C98.3661 18.3107 98.0205 18.524 97.6234 18.7004C97.4323 18.8034 97.2631 18.8916 97.0572 18.9799C96.6307 19.1637 95.8954 19.4137 94.9468 19.4137C94.8806 19.4137 94.8218 19.4137 94.7704 19.4137C94.7704 19.4137 94.763 19.4137 94.7556 19.4137C94.4541 19.399 94.1306 19.3548 93.785 19.2739C93.5424 19.2151 93.3291 19.1563 93.16 19.0901H93.1967C92.9614 19.0019 92.7556 18.899 92.5644 18.796C92.3658 18.6931 92.182 18.5901 92.0276 18.4872H92.0496C91.1011 17.8107 90.4981 16.7297 90.4981 15.237H98.6161C98.6161 15.237 98.6235 15.2223 98.6308 15.2223C99.1456 14.4722 99.9618 13.4355 100.704 13.1634C100.432 9.36174 97.697 7.16309 94.2777 7.16309C90.3584 7.16309 87.4023 10.1191 87.4023 14.5825C87.4023 19.046 90.2187 22.0021 94.9615 22.0021C96.9175 22.0021 98.3955 21.5902 100.256 20.2813C100.359 20.2004 100.462 20.127 100.572 20.0461C100.712 19.9358 100.859 19.8181 101.006 19.6931C101.344 19.399 101.624 19.1048 101.866 18.8254C102.035 18.6269 102.197 18.4357 102.33 18.2592C102.535 17.9136 102.969 17.2886 103.749 16.8032C104.153 16.5532 104.543 16.4135 104.852 16.3253V13.0163C104.227 13.2075 103.381 13.5531 102.506 14.1561L102.499 14.1782ZM94.3365 9.71466C96.1601 9.71466 97.6676 10.7442 97.8734 12.8105H90.6599C91.2114 10.7515 92.6526 9.71466 94.3365 9.71466Z"
                fill="#064771"
              />
            </svg>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col w-full mt-10">

            <label className="my-5 mb-1 font-poppins text-base font-normal text-[16px]">
              <span className="text-red-500 font-poppins">*</span> Email
            </label>

            <div className="flex items-center border border-gray-300 rounded-md p-2.5 mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="18"
                viewBox="0 0 21 18"
                fill="none"
                className="mr-2.5 text-gray-600"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.95148 2.57042C2.31896 3.15775 1.89535 4.11074 1.89535 5.60567V12.1173C1.89535 13.6122 2.31896 14.5652 2.95148 15.1526C3.59335 15.7486 4.56044 16.0708 5.84884 16.0708H15.1512C16.4395 16.0708 17.4066 15.7486 18.0486 15.1526C18.681 14.5652 19.1047 13.6122 19.1047 12.1173V5.60567C19.1047 4.11074 18.681 3.15775 18.0486 2.57042C17.4066 1.97439 16.4395 1.65218 15.1512 1.65218H5.84884C4.56044 1.65218 3.59335 1.97439 2.95148 2.57042ZM2.00201 1.54791C2.98805 0.632306 4.34654 0.256836 5.84884 0.256836H15.1512C16.6535 0.256836 18.012 0.632306 18.998 1.54791C19.9934 2.4722 20.5 3.84479 20.5 5.60567V12.1173C20.5 13.8782 19.9934 15.2508 18.998 16.1751C18.012 17.0907 16.6535 17.4661 15.1512 17.4661H5.84884C4.34654 17.4661 2.98805 17.0907 2.00201 16.1751C1.00662 15.2508 0.5 13.8782 0.5 12.1173V5.60567C0.5 3.84479 1.00662 2.4722 2.00201 1.54791Z"
                  fill="#838383"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17.3489 4.49867C17.5845 4.80356 17.5283 5.24172 17.2235 5.47731L12.0634 9.46456C11.1421 10.1764 9.85639 10.1764 8.93509 9.46456L3.77503 5.47731C3.47013 5.24172 3.41395 4.80356 3.64955 4.49867C3.88515 4.19376 4.3233 4.13759 4.6282 4.37319L9.78821 8.36038C10.207 8.68401 10.7915 8.68401 11.2102 8.36038L16.3703 4.37319C16.6752 4.13759 17.1133 4.19376 17.3489 4.49867Z"
                  fill="#838383"
                />
              </svg>

              <input
                type="email"
                placeholder="Write your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-none outline-none w-full text-base font-poppins placeholder:text-[14px]"
              />
            </div>

            <label className="my-5 mb-1 font-poppins text-base font-normal text-[16px]">
              <span className="text-red-500">*</span> Password
            </label>

            <div className="flex items-center border border-gray-300 rounded-md p-2.5 mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="18"
                viewBox="0 0 21 18"
                fill="none"
                className="mr-2.5 text-gray-600"
              >
                <path
                  d="M7.1 8.86152C7.1 9.30336 6.74182 9.66152 6.3 9.66152C5.85818 9.66152 5.5 9.30336 5.5 8.86152C5.5 8.41968 5.85818 8.06152 6.3 8.06152C6.74182 8.06152 7.1 8.41968 7.1 8.86152Z"
                  fill="#727272"
                />
                <path
                  d="M10.2992 8.86152C10.2992 9.30336 9.94106 9.66152 9.49922 9.66152C9.05738 9.66152 8.69922 9.30336 8.69922 8.86152C8.69922 8.41968 9.05738 8.06152 9.49922 8.06152C9.94106 8.06152 10.2992 8.41968 10.2992 8.86152Z"
                  fill="#727272"
                />
                <path
                  d="M11.8984 0.861328V16.8613"
                  stroke="#727272"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M17.5 8.86094C17.5 11.8779 17.5 13.3865 16.5627 14.3237C15.7122 15.1741 14.3914 15.2529 11.9 15.2602M9.5 2.46094H7.9C4.88301 2.46094 3.37452 2.46094 2.43726 3.39819C1.5 4.33546 1.5 5.84395 1.5 8.86094C1.5 11.8779 1.5 13.3865 2.43726 14.3237C3.37452 15.2609 4.88301 15.2609 7.9 15.2609H9.5M11.9 2.46168C14.3914 2.46897 15.7122 2.54772 16.5627 3.39819C17.0853 3.92074 17.3165 4.62085 17.4188 5.66094"
                  stroke="#727272"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-none outline-none w-full text-base font-poppins placeholder:text-[14px]"
              />

              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex justify-between items-center my-5">
              <label className="flex items-center font-poppins text-xs font-normal cursor-pointer">
                <input
                  type="checkbox"
                  className="hidden"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <div
                  className={`w-8 h-5 rounded-full relative transition-all ${rememberMe ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${rememberMe ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                  ></div>
                </div>

                <span className="ml-2 font-poppins">Remember me for 30 days</span>
              </label>
              <a
                href="#"
                className="text-[#064771] font-poppins text-sm font-semibold underline decoration-solid"
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="px-4 py-3 bg-[#064771] text-white border-0 rounded-full cursor-pointer text-lg font-bold font-poppins mt-5 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin border-4 border-white border-t-transparent rounded-full w-5 h-5 mr-2"></span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="flex justify-center items-center my-5">
              <p className="text-gray-500 my-5 font-poppins text-xs">
                Need an account?{' '}
                <a
                  href="#"
                  className="text-[#064771] font-bold underline decoration-solid font-poppins"
                >
                  Contact Administrator
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
