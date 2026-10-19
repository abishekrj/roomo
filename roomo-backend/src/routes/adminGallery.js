const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const defaults = require("../lib/galleryDefaults");
const router = express.Router();

router.use(authenticateToken, requireAdmin);

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const videoTypes = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
const uploadRoot = path.join(__dirname, "../../uploads/gallery");
for (const folder of ["images", "videos"]) fs.mkdirSync(path.join(uploadRoot, folder), { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(uploadRoot, req.query.type === "video" ? "videos" : "images")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
    cb(null, Date.now() + "-" + crypto.randomBytes(8).toString("hex") + (ext || (req.query.type === "video" ? ".mp4" : ".jpg")));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = req.query.type === "video" ? videoTypes : imageTypes;
    if (!allowed.has(file.mimetype)) return cb(new Error(req.query.type === "video" ? "Upload an MP4, WebM, OGG, or MOV video." : "Upload a JPG, PNG, WebP, or AVIF image."));
    cb(null, true);
  }
});

const itemSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().default(""),
  type: z.enum(["IMAGE", "VIDEO"]),
  sourceType: z.enum(["UPLOAD", "URL", "YOUTUBE"]),
  mediaUrl: z.string().trim().url().max(3000).refine(value => value.startsWith("https://") || value.startsWith("http://"), "Use an HTTP or HTTPS media URL."),
  thumbnailUrl: z.string().trim().url().max(3000).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional()
}).superRefine((data, ctx) => {
  if (data.type === "IMAGE" && data.sourceType === "YOUTUBE") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceType"], message: "YouTube is only available for videos." });
  }
  if (data.type === "VIDEO" && data.sourceType === "YOUTUBE" && !/youtube(?:-nocookie)?\.com\/embed\//i.test(data.mediaUrl)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mediaUrl"], message: "Use a valid YouTube embed URL." });
  }
});

router.get("/", async (req, res, next) => {
  try {
    let items = await prisma.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    if (!items.length) {
      for (const item of defaults) await prisma.galleryItem.create({ data: item });
      items = await prisma.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    }
    res.json({ items });
  } catch (error) { next(error); }
});

router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, error => {
    if (error) return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ message: error.message || "Unable to upload this file." });
    if (!req.file) return res.status(400).json({ message: "Choose a file to upload." });
    const baseUrl = process.env.PUBLIC_API_URL || (req.protocol + "://" + req.get("host"));
    const folder = req.query.type === "video" ? "videos" : "images";
    res.status(201).json({
      message: "Media uploaded successfully.",
      mediaUrl: baseUrl + "/uploads/gallery/" + folder + "/" + req.file.filename,
      type: folder === "videos" ? "VIDEO" : "IMAGE",
      sourceType: "UPLOAD"
    });
  });
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = itemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the gallery fields.", errors: parsed.error.flatten() });
    const item = await prisma.galleryItem.create({ data: { ...parsed.data, status: parsed.data.status || "DRAFT", sortOrder: parsed.data.sortOrder || 0 } });
    res.status(201).json({ message: "Gallery item created.", item });
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const parsed = itemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the gallery fields.", errors: parsed.error.flatten() });
    const existing = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Gallery item not found." });
    const item = await prisma.galleryItem.update({ where: { id: req.params.id }, data: { ...parsed.data, status: parsed.data.status || existing.status, sortOrder: parsed.data.sortOrder ?? existing.sortOrder } });
    res.json({ message: "Gallery item updated.", item });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Gallery item not found." });
    await prisma.galleryItem.delete({ where: { id: req.params.id } });
    res.json({ message: "Gallery item deleted." });
  } catch (error) { next(error); }
});

module.exports = router;
