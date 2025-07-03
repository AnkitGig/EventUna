// Return static OTP "0000" for development
export const generateOtp = () => {
  return "0000";

  // For random OTP: return Math.floor(1000 + Math.random() * 9000).toString();
};


