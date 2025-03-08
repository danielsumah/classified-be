import {
  Injectable,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import sharp from 'sharp';
import * as AWS from 'aws-sdk';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

type ImageFolderTypes = 'avatars' | 'company_service_images' | 'receipts'

interface S3UploadResponse {
  ETag: string;
  Location: string;
  key: string;
  Bucket: string;
}
@Injectable()
export class FileService {
  MIN_COMPANY_AVATAR_WIDTH = 640;
  MIN_COMPANY_AVATART_HEIGHT = 320;

  constructor(private configService: ConfigService) {
    const awsS3Key = this.configService.get<string>('AWS_S3_KEY', '');
    const awsS3Secret = this.configService.get<string>('AWS_S3_SECRET', '');
    const awsS3Region = this.configService.get<string>('AWS_S3_REGION', '');

    if (!awsS3Key || !awsS3Secret || !awsS3Region) {
      Logger.error('One or more AWS S3 credentials are not set');
    }
  }

  async checkImageSizeAndFormat(avatar: Express.Multer.File) {
    if (avatar.mimetype !== 'image/jpeg' && avatar.mimetype !== 'image/png') {
      throw new NotAcceptableException('Only images are allowed');
    }

    const metadata = await sharp(avatar.buffer).metadata();
    if (metadata.width < this.MIN_COMPANY_AVATAR_WIDTH) {
      throw new NotAcceptableException(
        `Image width must be at least ${this.MIN_COMPANY_AVATAR_WIDTH}px. Expecting a ${this.MIN_COMPANY_AVATAR_WIDTH} by ${this.MIN_COMPANY_AVATART_HEIGHT} image`,
      );
    }
    if (metadata.height < this.MIN_COMPANY_AVATART_HEIGHT) {
      throw new NotAcceptableException(
        `Image height must be at least ${this.MIN_COMPANY_AVATART_HEIGHT}px. Expecting a ${this.MIN_COMPANY_AVATAR_WIDTH} by ${this.MIN_COMPANY_AVATART_HEIGHT} image`,
      );
    }
  }

  async validateImage(avatar: Express.Multer.File): Promise<void> {
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    const maxFileSize = 5 * 1024 * 1024;

    if (!allowedMimeTypes.includes(avatar.mimetype)) {
      throw new NotAcceptableException(
        'Invalid image format. Only JPEG and PNG are allowed.',
      );
    }

    if (avatar.size > maxFileSize) {
      throw new NotAcceptableException(
        'File size exceeds the maximum limit of 5 MB.',
      );
    }
  }

  async uploadAvatarToS3(avatar: Express.Multer.File, folder: ImageFolderTypes): Promise<S3UploadResponse> {
    const s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_S3_KEY'),
      secretAccessKey: this.configService.get<string>('AWS_S3_SECRET'),
      region: this.configService.get<string>('AWS_S3_REGION'),
    });

    const bucketName = this.configService.get<string>('AWS_BUCKET');
    const fileKey = `${folder}/${Date.now()}-${path.basename(avatar.originalname)}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: fileKey,
      Body: avatar.buffer,
      ContentType: avatar.mimetype,
    };

    const uploadedFile = await s3.upload(params).promise();

    return {
      ETag: uploadedFile.ETag,
      Location: uploadedFile.Location,
      key: uploadedFile.Key,
      Bucket: uploadedFile.Bucket
    }
  }
}
