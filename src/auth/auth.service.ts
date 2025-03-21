import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDto) {
    // Generate the password hash
    const hash = await argon.hash(dto.password);

    try {
      // Save the new user in the db
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      // return the saved user
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Email already exists');
      }

      throw new ForbiddenException('Something went wrong!');
    }
  }

  async signin(dto: AuthDto) {
    // Find the user by email
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    // If user does not exist throw exception
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Compare password
    const isPassMatch = await argon.verify(user.hash, dto.password);

    // If password is incorrect throw exception
    if (!isPassMatch) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Return the user
    return user;
  }
}
