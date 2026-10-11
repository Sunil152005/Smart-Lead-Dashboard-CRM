import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";
import { isMongoConnected, memoryStore } from "../services/db";
import { AuthRequest } from "../middlewares/authMiddleware";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = "SALES" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role.toUpperCase() === "ADMIN" ? "ADMIN" : "SALES";

    let createdUser: any = null;

    if (isMongoConnected) {
      try {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return res.status(400).json({ message: "Email already registered." });
        }

        createdUser = await User.create({
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: assignedRole,
        });
      } catch (err: any) {
        console.warn("MongoDB register error, using resilient store:", err.message);
      }
    }

    // Always ensure user is added to local memoryStore
    const existingMem = memoryStore.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existingMem && !createdUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    if (!createdUser) {
      createdUser = {
        _id: `user_${Date.now()}`,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
        avatar: "",
        createdAt: new Date(),
      };
      memoryStore.users.push(createdUser);
    } else {
      memoryStore.users.push({
        _id: String(createdUser._id),
        name: createdUser.name,
        email: createdUser.email,
        password: hashedPassword,
        role: createdUser.role,
        avatar: createdUser.avatar || "",
        createdAt: new Date(),
      });
    }

    const token = jwt.sign(
      {
        id: createdUser._id,
        email: createdUser.email,
        role: createdUser.role,
        name: createdUser.name,
      },
      process.env.JWT_SECRET || "mysecret",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Registration successful",
      token,
      role: createdUser.role,
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        avatar: createdUser.avatar,
      },
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let foundUser: any = null;

    if (isMongoConnected) {
      try {
        foundUser = await User.findOne({ email: normalizedEmail });
      } catch (err: any) {
        console.warn("MongoDB login search error, falling back to local store:", err.message);
      }
    }

    // Fallback to memoryStore
    if (!foundUser) {
      foundUser = memoryStore.users.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
    }

    if (!foundUser) {
      return res.status(400).json({
        message: "No account found with this email. Try Demo Account or Register.",
      });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password. Please try again.",
      });
    }

    const token = jwt.sign(
      {
        id: foundUser._id,
        email: foundUser.email,
        role: foundUser.role,
        name: foundUser.name,
      },
      process.env.JWT_SECRET || "mysecret",
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: foundUser.role,
      user: {
        id: foundUser._id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        avatar: foundUser.avatar,
      },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user: any = null;
    if (isMongoConnected && mongoose.isValidObjectId(req.user.id)) {
      try {
        user = await User.findById(req.user.id).select("-password");
      } catch (err) {
        user = null;
      }
    }

    if (!user) {
      const u = memoryStore.users.find((item) => String(item._id) === String(req.user?.id));
      if (u) {
        user = {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar,
        };
      }
    }

    if (!user) {
      return res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          name: req.user.name || "User",
        },
      });
    }

    return res.json({ user });
  } catch (error: any) {
    console.error("GetMe Error:", error);
    return res.status(500).json({ message: "Failed to retrieve user profile." });
  }
};