import { PartialType } from '@nestjs/mapped-types';
import { CreateWeightDto } from './create-weight.dto';

export class UpdateWeightDto extends PartialType(CreateWeightDto) {}
