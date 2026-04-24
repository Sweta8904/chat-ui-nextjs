"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError("");

    // ✅ Validation
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-800 px-4">
      
      <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col gap-4">
        
        <h1 className="text-2xl font-bold text-center">Welcome Back</h1>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            className="bg-gray-800 text-white border border-gray-700 p-2 rounded w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-2 cursor-pointer text-gray-400 text-sm"
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`py-2 rounded font-semibold transition ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="text-center text-gray-400 text-sm">OR</div>

        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="bg-red-500 hover:bg-red-600 transition py-2 rounded font-semibold"
        >
          Continue with Google
        </button>

        {/* GitHub */}
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="bg-gray-800 hover:bg-black transition py-2 rounded font-semibold border border-gray-700"
        >
          Continue with GitHub
        </button>

        {/* Signup redirect */}
        <p className="text-sm text-gray-400 text-center">
          Don’t have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => router.push("/signup")}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
}