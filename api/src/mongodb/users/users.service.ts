
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { User, UserRole } from '../../entities/mongodb/User';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { Announcement, AnnouncementStatus } from '../../entities/mongodb/Announcement';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { geocodeAddress, pointInPolygon } from '../../common/utils/geo';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User, 'mongodb')
    private usersRepository: MongoRepository<User>,
    @InjectRepository(Neighbourhood, 'mongodb')
    private neighbourhoodsRepository: MongoRepository<Neighbourhood>,
    @InjectRepository(Announcement, 'mongodb')
    private announcementsRepository: MongoRepository<Announcement>,
    @InjectDataSource('mongodb')
    private dataSource: DataSource,
  ) { }

  async countByNeighbourhood(neighbourhoodId: string): Promise<number> {
    return this.usersRepository.count({ where: { neighbourhoodId, isActive: true } as any });
  }

  async findByNeighbourhood(neighbourhoodId: string) {
    return this.usersRepository.find({ where: { neighbourhoodId } as any });
  }

  async findAdmins() {
    const admins = await this.usersRepository.find({
      where: { role: UserRole.ADMIN } as any,
    });
    return admins.map(({ _id, firstName, lastName, role, neighbourhoodId }) => ({
      _id,
      firstName,
      lastName,
      role,
      neighbourhoodId,
    }));
  }

  async findAll() {
    const users = await this.usersRepository.find();
    if (users.length === 0) {
      throw new NotFoundException('No users found');
    }
    return users;
  }


  async findOne(id: string) {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new BadRequestException('Invalid ID format');
    }
    const user = await this.usersRepository.findOneBy({ _id: objectId });
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

    const hash = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({ ...createUserDto, password: hash });

    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOne(id);
    const oldNeighbourhoodId = existingUser.neighbourhoodId;

    if (updateUserDto.email) {
      const userWithSameEmail = await this.findByEmail(updateUserDto.email);
      if (userWithSameEmail && userWithSameEmail._id.toString() !== id) {
        throw new ConflictException(
          `User with email ${updateUserDto.email} already exists`,
        );
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const newAddress = (updateUserDto as { address?: string }).address;
    if (newAddress && newAddress !== existingUser.address) {
      let neighbourhoodId: string | null = null;
      const coords = await geocodeAddress(newAddress);
      if (coords) {
        const neighbourhoods = await this.neighbourhoodsRepository.find();
        const match = neighbourhoods.find(
          (n) => n.geometry && pointInPolygon(coords.lng, coords.lat, n.geometry),
        );
        if (match) neighbourhoodId = match.id.toString();
      }
      existingUser.neighbourhoodId = neighbourhoodId as any;
    }

    Object.assign(existingUser, updateUserDto);
    const saved = await this.usersRepository.save(existingUser);

    if (oldNeighbourhoodId && oldNeighbourhoodId !== saved.neighbourhoodId) {
      await this.cancelActiveAnnouncementsInNeighbourhood(id, oldNeighbourhoodId);
    }

    return saved;
  }

  async recheckResidentsAfterGeometryChange(neighbourhoodId: string) {
    const residents = await this.usersRepository.find({
      where: {
        $or: [{ neighbourhoodId }, { neighbourhoodId: null }, { neighbourhoodId: { $exists: false } }],
      } as any,
    });
    if (!residents.length) return;

    const neighbourhoods = await this.neighbourhoodsRepository.find();

    const changed: User[] = [];
    const reassignments: { userId: string; oldNeighbourhoodId: string }[] = [];

    for (const resident of residents) {
      if (!resident.address) continue;

      const coords = await geocodeAddress(resident.address);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!coords) continue;

      const match = neighbourhoods.find(
        (n) => n.geometry && pointInPolygon(coords.lng, coords.lat, n.geometry),
      );
      const newNeighbourhoodId = match ? match.id.toString() : null;

      if (newNeighbourhoodId === resident.neighbourhoodId) continue;

      reassignments.push({ userId: resident._id.toString(), oldNeighbourhoodId: resident.neighbourhoodId });
      resident.neighbourhoodId = newNeighbourhoodId as any;
      changed.push(resident);
    }

    if (!changed.length) return;

    await this.usersRepository.save(changed);

    for (const { userId, oldNeighbourhoodId } of reassignments) {
      if (!oldNeighbourhoodId) continue;
      await this.cancelActiveAnnouncementsInNeighbourhood(userId, oldNeighbourhoodId);
    }
  }

  private async cancelActiveAnnouncementsInNeighbourhood(authorId: string, neighbourhoodId: string) {
    const activeAnnouncements = await this.announcementsRepository.find({
      where: {
        authorId,
        neighbourhoodId,
        status: { $in: [AnnouncementStatus.OPEN, AnnouncementStatus.ACCEPTED] },
      } as any,
    });
    if (!activeAnnouncements.length) return;
    for (const announcement of activeAnnouncements) {
      announcement.status = AnnouncementStatus.CANCELLED;
    }
    await this.announcementsRepository.save(activeAnnouncements);
  }

  async delete(id: string) {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
    return { message: `User with id ${id} has been deleted` };
  }

  private getDb() {
    return (this.dataSource.driver as any).queryRunner.databaseConnection.db();
  }

  async exportData(userId: string) {
    const user = await this.findOne(userId);
    const { password, ...profile } = user as any;
    const db = this.getDb();

    const [announcements, conversations, messages, documents, events, votes] = await Promise.all([
      db.collection('announcements').find({ authorId: userId }).toArray(),
      db.collection('conversations').find({ participants: userId }).toArray(),
      db.collection('messages').find({ senderId: userId }).toArray(),
      db.collection('documents').find({ $or: [{ ownerId: userId }, { signers: userId }] }).toArray(),
      db.collection('events').find({ attendees: userId }).toArray(),
      db.collection('votes').find({ 'options.voters': userId }).toArray(),
    ]);

    return { profile, announcements, conversations, messages, documents, events, votes };
  }

  async deleteAccount(userId: string) {
    const db = this.getDb();

    await Promise.all([
      db.collection('announcements').deleteMany({ authorId: userId }),
      db.collection('messages').deleteMany({ senderId: userId }),
      db.collection('documents').deleteMany({ ownerId: userId }),
      db.collection('refresh_tokens').deleteMany({ userId }),
      db.collection('conversations').deleteMany({ participants: userId }),
    ]);

    await this.usersRepository.delete(new ObjectId(userId));
    return { message: 'Compte et donnees supprimees' };
  }
}
