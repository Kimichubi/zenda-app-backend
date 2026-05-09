import { Injectable } from "@nestjs/common";

@Injectable()
export class UploadService {
  processAvatar(file: Express.Multer.File) {
    const path = `/uploads/avatars/${file.filename}`;
    return {
      path,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
