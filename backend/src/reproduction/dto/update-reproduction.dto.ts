import { PartialType } from '@nestjs/mapped-types';
import { CreateReproductionDto } from './create-reproduction.dto';

export class UpdateReproductionDto extends PartialType(CreateReproductionDto) {}
