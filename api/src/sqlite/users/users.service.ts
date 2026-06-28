import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSqlite } from '../../entities/sqlite/UserSqlite';
import { CreateUserSqliteDto } from './dto/create-user.dto';
import { UpdateUserSqliteDto } from './dto/update-user.dto';

@Injectable()
export class UsersSqliteService {
  constructor(
    @InjectRepository(UserSqlite, 'sqlite')  
    private readonly usersRepository: Repository<UserSqlite>,
  ) {}

  create(createUserDto: CreateUserSqliteDto) {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }


  findOne(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }


  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  update(id: number, updateUserDto: UpdateUserSqliteDto) {
    return this.usersRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }
}