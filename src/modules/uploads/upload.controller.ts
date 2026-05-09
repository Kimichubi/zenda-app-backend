import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { v4 as uuidv4 } from "uuid";
import { mkdirSync, existsSync } from "fs";
import { UploadService } from "./upload.service";

const UPLOADS_DIR = join(process.cwd(), "uploads", "avatars");

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

const imageFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
    return cb(new BadRequestException("Only image files are allowed"), false);
  }
  cb(null, true);
};

const avatarStorage = diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

@Controller("uploads")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("avatar")
  @UseInterceptors(FileInterceptor("file", {
    storage: avatarStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.processAvatar(file);
  }
}
