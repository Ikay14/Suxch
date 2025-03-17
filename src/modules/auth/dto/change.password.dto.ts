import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import { Match } from 'src/common/costraints';
import { ApiProperty } from '@nestjs/swagger';

export class ForgetPasswordDto {
  @ApiProperty({
    description: 'The reset token sent to the user’s email for password reset',
    example: '12345abcde',

  })
  @IsString()
  otp: string;

  @ApiProperty({
    description: 'The new password for the user account',
    example: 'NewPassword123!',

    minLength: 8,
  })
  @IsNotEmpty()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation of the new password to ensure they match',
    example: 'NewPassword123!',

  })
  @IsNotEmpty()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmNewPassword: string;

  @IsEmail()
  email:string
}
