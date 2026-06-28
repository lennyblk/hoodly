import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Announcement, AnnouncementStatus } from '../../entities/mongodb/Announcement';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { UsersService } from '../users/users.service';
import { Neo4jService } from '../../neo4j/neo4j.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement, 'mongodb')
    private announcementsRepository: MongoRepository<Announcement>,
    @InjectRepository(Neighbourhood, 'mongodb')
    private neighbourhoodsRepository: MongoRepository<Neighbourhood>,
    private usersService: UsersService,
    private neo4jService: Neo4jService,
  ) {}

  async findAll(neighbourhoodId?: string) {
    if (neighbourhoodId) {
      return this.announcementsRepository.find({ where: { neighbourhoodId } as any });
    }
    return this.announcementsRepository.find();
  }

  async findOne(id: string) {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      throw new BadRequestException('Invalid format for Announcement ID');
    }

    const announcement = await this.announcementsRepository.findOneBy({ _id: objectId });
    if (!announcement) {
      throw new NotFoundException(`Announcement with id ${id} not found`);
    }
    return announcement;
  }

  private async validateReferences(authorId?: string, neighbourhoodId?: string, acceptedBy?: string, currentAnnouncement?: Announcement) {
    const finalAuthorId = authorId || currentAnnouncement?.authorId;
    const finalAcceptedBy = acceptedBy !== undefined ? acceptedBy : currentAnnouncement?.acceptedBy;

    if (finalAuthorId && finalAcceptedBy && finalAuthorId === finalAcceptedBy) {
      throw new BadRequestException('The author cannot accept their own announcement');
    }

    if (authorId) {
      try {
        await this.usersService.findOne(authorId);
      } catch (e) {
        throw new BadRequestException(`Author with id ${authorId} does not exist`);
      }
    }

    if (acceptedBy) {
      try {
        await this.usersService.findOne(acceptedBy);
      } catch (e) {
        throw new BadRequestException(`User with id ${acceptedBy} does not exist`);
      }
    }

    if (neighbourhoodId) {
      let nid: ObjectId;
      try {
        nid = new ObjectId(neighbourhoodId);
      } catch (e) {
        throw new BadRequestException('Invalid format for Neighbourhood ID');
      }
      const neighbourhood = await this.neighbourhoodsRepository.findOneBy({ _id: nid });
      if (!neighbourhood) {
        throw new BadRequestException(`Neighbourhood with id ${neighbourhoodId} does not exist`);
      }
    }
  }

  async create(createAnnouncementDto: CreateAnnouncementDto) {
    await this.validateReferences(
      createAnnouncementDto.authorId,
      createAnnouncementDto.neighbourhoodId
    );

    const announcement = this.announcementsRepository.create(createAnnouncementDto as any);
    return this.announcementsRepository.save(announcement);
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto) {
    const announcement = await this.findOne(id);

    await this.validateReferences(
      updateAnnouncementDto.authorId,
      updateAnnouncementDto.neighbourhoodId,
      updateAnnouncementDto.acceptedBy,
      announcement
    );

    const isNewAcceptance =
      !announcement.acceptedBy &&
      updateAnnouncementDto.acceptedBy &&
      (updateAnnouncementDto.status === AnnouncementStatus.ACCEPTED ||
        announcement.status === AnnouncementStatus.OPEN);

    Object.assign(announcement, updateAnnouncementDto);
    const saved = await this.announcementsRepository.save(announcement);

    if (isNewAcceptance) {
      await this.neo4jService.run(
        `MERGE (helper:User {id: $helperId})
         MERGE (receiver:User {id: $receiverId})
         MERGE (helper)-[:HELPED]->(receiver)`,
        {
          helperId: updateAnnouncementDto.acceptedBy,
          receiverId: saved.authorId,
        },
      ).catch(() => {});
    }

    return saved;
  }

  async accept(id: string, userId: string) {
    const announcement = await this.findOne(id);
    if (announcement.authorId === userId) {
      throw new BadRequestException('The author cannot accept their own announcement');
    }
    if (announcement.status !== 'open') {
      throw new BadRequestException('Only open announcements can be accepted');
    }
    announcement.status = 'accepted' as any;
    announcement.acceptedBy = userId;
    return this.announcementsRepository.save(announcement);
  }

  async remove(id: string) {
    const announcement = await this.findOne(id);
    return this.announcementsRepository.remove(announcement);
  }
}
