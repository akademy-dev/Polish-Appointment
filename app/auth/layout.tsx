const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[url('/login.png')] bg-cover bg-center">
      {children}
    </div>
  );
};

export default AuthLayout;
