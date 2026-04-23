import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // 🔒 Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 🔍 Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user (MATCH NextAuth)
    const newUser = await User.create({
      name: name || "",
      email,
      passwordHash: hashedPassword, // ✅ FIXED
      provider: "credentials",      // ✅ IMPORTANT
    });

    // ✅ Response (no password)
    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      { error: "Signup failed" },
      { status: 500 }
    );
  }
}