"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
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

      alert("Signup successful! Please login.");
      router.push("/login");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-800">
      
      <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl w-80 flex flex-col gap-4">
        
        <h1 className="text-2xl font-bold text-center">Create Account</h1>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        {/* Name */}
        <input
          type="text"
          placeholder="Name"
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setName(e.target.value)}
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Signup Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 transition py-2 rounded font-semibold"
        >
          {loading ? "Creating account..." : "Signup"}
        </button>

        {/* Redirect */}
        <p className="text-sm text-gray-400 text-center">
          Already have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}