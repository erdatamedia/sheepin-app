import { PartialType } from '@nestjs/mapped-types';
import { CreateBcsDto } from './create-bcs.dto';

export class UpdateBcsDto extends PartialType(CreateBcsDto) {}
