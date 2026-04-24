"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");

    // ✅ validation
    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // ✅ auto login after signup (better UX)
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      router.push("/");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-800 px-4">
      
      <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col gap-4">
        
        <h1 className="text-2xl font-bold text-center">
          Create Account
        </h1>

        {error && (
          <p className="text-red-400 text-sm text-center">
            {error}
          </p>
        )}

        {/* Name */}
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Signup Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 transition py-2 rounded font-semibold"
        >
          {loading ? "Creating account..." : "Signup"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <hr className="flex-1 border-gray-700" />
          OR
          <hr className="flex-1 border-gray-700" />
        </div>

        {/* OAuth Buttons */}
        <button
          onClick={() => signIn("google")}
          className="bg-red-500 hover:bg-red-600 py-2 rounded"
        >
          Continue with Google
        </button>

        <button
          onClick={() => signIn("github")}
          className="bg-gray-700 hover:bg-gray-800 py-2 rounded"
        >
          Continue with GitHub
        </button>

        {/* Redirect */}
        <p className="text-sm text-gray-400 text-center">
          Already have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => router.push("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}