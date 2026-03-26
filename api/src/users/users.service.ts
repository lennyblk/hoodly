
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { User } from '../entities/mongodb/User';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User, 'mongodb')
    private usersRepository: MongoRepository<User>,
  ) { }

  async findAll() {
    const users = await this.usersRepository.find();
    if (users.length === 0) {
      throw new NotFoundException('No users found');
    }
    return users;
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { _id: new ObjectId(id) } as any });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto) {
    if ((await this.findByEmail(createUserDto.email)) !== null) {
      throw new ConflictException(
        `User with email ${createUserDto.email} already exists`,
      );
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOne(id);

    if (updateUserDto.email) {
      const userWithSameEmail = await this.findByEmail(updateUserDto.email);
      if (userWithSameEmail && userWithSameEmail.id.toString() !== id) {
        throw new ConflictException(
          `User with email ${updateUserDto.email} already exists`,
        );
      }
    }

    Object.assign(existingUser, updateUserDto);
    return this.usersRepository.save(existingUser);
  }

  async delete(id: string) {
    const user = await this.usersRepository.findOne({ where: { _id: new ObjectId(id) } as any });
    if (!user) {
      return { message: `User with id ${id} not found` };
    }
    await this.usersRepository.remove(user);
    return { message: `User with id ${id} has been deleted` };
  }
}
