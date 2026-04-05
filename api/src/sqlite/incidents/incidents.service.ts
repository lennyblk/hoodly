import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Incident } from '../../entities/sqlite/Incident';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { UsersService } from '../../mongodb/users/users.service';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident, 'sqlite')
    private incidentsRepository: Repository<Incident>,
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<Incident[]> {
    return this.incidentsRepository.find();
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentsRepository.findOneBy({ id });
    if (!incident) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }
    return incident;
  }

  async create(createIncidentDto: CreateIncidentDto): Promise<Incident> {
    // Basic verification of the reporting user
    if (createIncidentDto.reportedBy) {
      // In a real scenario we'd do a specific error mapping, but we rely on usersService to throw if invalid.
      await this.usersService.findOne(createIncidentDto.reportedBy).catch(() => {
         throw new NotFoundException(`User ${createIncidentDto.reportedBy} not found`);
      });
    }

    const payload: any = {
      ...createIncidentDto,
      id: createIncidentDto.id || randomUUID(),
      reportedAt: createIncidentDto.reportedAt ? new Date(createIncidentDto.reportedAt) : new Date(),
    };
    if (createIncidentDto.syncedAt) {
      payload.syncedAt = new Date(createIncidentDto.syncedAt);
    }

    const incident = this.incidentsRepository.create(payload as any);
    return this.incidentsRepository.save(incident);
  }

  async update(id: string, updateIncidentDto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id);
    
    if (updateIncidentDto.reportedBy) {
      await this.usersService.findOne(updateIncidentDto.reportedBy).catch(() => {
         throw new NotFoundException(`User ${updateIncidentDto.reportedBy} not found`);
      });
    }

    Object.assign(incident, updateIncidentDto);
    
    if (updateIncidentDto.reportedAt) {
        incident.reportedAt = new Date(updateIncidentDto.reportedAt);
    }
    if (updateIncidentDto.syncedAt) {
        incident.syncedAt = new Date(updateIncidentDto.syncedAt);
    }

    return this.incidentsRepository.save(incident);
  }

  async remove(id: string): Promise<Incident> {
    const incident = await this.findOne(id);
    return this.incidentsRepository.remove(incident);
  }
}
