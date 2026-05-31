import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Vote, VoteResult } from '../../entities/mongodb/Vote';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { CreateVoteDto } from './dto/create-vote.dto';
import { CastVoteDto } from './dto/cast-vote.dto';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote, 'mongodb')
    private votesRepository: MongoRepository<Vote>,
    @InjectRepository(Neighbourhood, 'mongodb')
    private neighbourhoodsRepository: MongoRepository<Neighbourhood>,
  ) { }

  async findAll(neighbourhoodId?: string) {
    if (neighbourhoodId) {
      return this.votesRepository.find({ where: { neighbourhoodId } as any });
    }
    return this.votesRepository.find();
  }

  async findOne(id: string) {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new BadRequestException('Invalid ID format');
    }
    const vote = await this.votesRepository.findOneBy({ _id: objectId } as any);
    if (!vote) {
      throw new NotFoundException(`Vote with id ${id} not found`);
    }
    return vote;
  }

  private async validateNeighbourhood(neighbourhoodId: string) {
    let nid: ObjectId;
    try {
      nid = new ObjectId(neighbourhoodId);
    } catch {
      throw new BadRequestException('Invalid format for Neighbourhood ID');
    }
    const neighbourhood = await this.neighbourhoodsRepository.findOneBy({ _id: nid } as any);
    if (!neighbourhood) {
      throw new BadRequestException(`Neighbourhood with id ${neighbourhoodId} does not exist`);
    }
  }

  async create(dto: CreateVoteDto) {
    await this.validateNeighbourhood(dto.neighbourhoodId);

    // Initialiser results avec des entrés vide pour chaque option qui sera rempli par des userIds
    const results: VoteResult[] = dto.options.map((option) => ({
      option,
      userIds: [],
    }));

    const vote = this.votesRepository.create({
      ...dto,
      endsAt: new Date(dto.endsAt),
      results,
    });
    return this.votesRepository.save(vote);
  }

  async remove(id: string) {
    const vote = await this.findOne(id);
    return this.votesRepository.remove(vote);
  }

  async cast(id: string, dto: CastVoteDto) {
    const vote = await this.findOne(id);

    if (new Date() > new Date(vote.endsAt)) {
      throw new ForbiddenException('Ce vote est terminé');
    }

    if (!vote.options.includes(dto.option)) {
      throw new BadRequestException(
        `Option invalide. Choix possibles : ${vote.options.join(', ')}`,
      );
    }

    vote.results = vote.results.map((r) => ({
      ...r,
      userIds: r.userIds?.filter((uid) => uid.toString() !== dto.userId) ?? [],
    }));

    const entry = vote.results.find((r) => r.option === dto.option)!;
    entry.userIds = [...entry.userIds, new ObjectId(dto.userId) as any];

    const saved = await this.votesRepository.save(vote);

    if (saved.isAnonymous) {
      saved.results = saved.results.map((r) => ({ ...r, userIds: [] }));
    }

    return saved;
  }

  async getResults(id: string) {
    const vote = await this.findOne(id);

    if (vote.isAnonymous) {
      vote.results = vote.results?.map((r) => ({ ...r, userIds: [] })) ?? [];
    }

    return vote;
  }
}
