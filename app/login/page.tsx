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

  const handleLogin = async () => {
    setLoading(true);
    setError("");

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
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-800">
      
      <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl w-80 flex flex-col gap-4">
        
        <h1 className="text-2xl font-bold text-center">Welcome Back</h1>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="bg-gray-800 border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="bg-gray-800 border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 transition py-2 rounded font-semibold"
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
      </div>
    </div>
  );
}