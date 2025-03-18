import { BadRequestException, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { RegisterUserDto } from '../auth/dto/register.dto';

@Injectable()
export class UserService {
    constructor(
        private cloudinaryService: CloudinaryService,
       @InjectModel( User.name) 
       private userModel: Model<User>
    ){}

    async upsetUser(registerUserDto: RegisterUserDto):Promise<any>{
        try {
            const created = await this.userModel.create(registerUserDto);
            return {
              message: 'created successfully',
              data: created,
            };
          } catch (error) {
            throw new NotAcceptableException(error);
          }
    }

    async uploadProfilePicture(file: Express.Request['file'], userId: string,) {
        const user = await this.getUserById(userId)
        const folder = `profile-pictures/${userId}`;

        if (user.data.avatar) await this.cloudinaryService.deleteFile(user.data.avatar);

        const result = await this.cloudinaryService.uploadFile(file, folder, 'image');
       
        user.data.avatar = result.secure_url
        user.data.profileUrl = result.public_id
        await user.data.save()

        return {
          msg: 'Profile picture uploaded successfully',
          result
        }; 
      }

    async deleteProfilePicture(imageUrl: string,  userId: string) {
        const publicId = this.cloudinaryService.extractPublicId(imageUrl);
        await this.cloudinaryService.deleteFile(publicId, 'image');

        const user = await this.userModel.updateOne({_id: userId}, 
          { $unset: { avatar: 1 }
        })
        if (user.modifiedCount === 0) {
          throw new BadRequestException('Profile picture not found or already deleted');
        }
        return { msg: 'Profile picture deleted successfully' };
      }

    async getUserById(userId: any){
       const user = await this.userModel.findById(userId).exec()
       if(!user) throw new NotFoundException('user not found')
        return {
            msg: 'user retrieved successfully',
            data: user
        }
    }

    async findByAny(
        params: { key: string; value: string },
        query: any,
      ): Promise<any> {
        const { key, value } = params;
        const { skip = 0, limit = 0 } = query;
    
        const result = await this.userModel
          .find({ [key]: value, isDeleted: false })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        if (!result.length) {
          throw new NotFoundException(value + ' not found in field ' + key);
        }
        return {
          message: 'Success',
          data: result,
        };
      }
    
      async findAll(query: any): Promise<any> {
        const { skip = 0, limit = 0 } = query;
        try {
          const data = await this.userModel
            .find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
          if (!data.length) {
            throw new NotFoundException();
          }
          return {
            message: 'Success',
            data,
          };
        } catch (error) {
          throw new NotFoundException(error);
        }
      }
    
      async delete(req: any): Promise<any> {
        try {
        const userId = req.user._id
        const user = await this.userModel.findById(userId).exec();
        user.isDeleted = true  
        await user.save()
          return {
            message: 'Delete Successfully',
          };
        } catch (error) {
          throw new NotFoundException(error);
        }
      }
}
