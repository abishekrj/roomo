
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../lib/prisma");

const router = express.Router();

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

function createToken(owner) {
  return jwt.sign(
    { sub: owner.id },
    process.env.JWT_SECRET,
    { expiresIn: "12h", issuer: "roomo-api", audience: "roomo-admin" }
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Please check your registration details.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const fullName = parsed.data.fullName;
    const email = parsed.data.email.toLowerCase();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const owner = await prisma.owner.create({
      data: { fullName, email, passwordHash },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "Owner account created successfully.",
      owner,
      token: createToken(owner),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Please enter a valid email and password.",
      });
    }

    const email = parsed.data.email.toLowerCase();

    const owner = await prisma.owner.findUnique({
      where: { email },
    });

    const passwordMatches = owner
      ? await bcrypt.compare(parsed.data.password, owner.passwordHash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const safeOwner = {
      id: owner.id,
      fullName: owner.fullName,
      email: owner.email,
    };

    res.json({
      message: "Login successful.",
      owner: safeOwner,
      token: createToken(owner),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
