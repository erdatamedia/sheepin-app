import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { LocationSource } from '@prisma/client';

type LocationCoordinates = {
  latitude?: number;
  longitude?: number;
};

export class UpdateMyLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  regency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  village?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressDetail?: string;

  @ValidateIf(
    (o: LocationCoordinates) =>
      o.longitude !== undefined || o.latitude !== undefined,
  )
  @IsLatitude()
  latitude?: number;

  @ValidateIf(
    (o: LocationCoordinates) =>
      o.latitude !== undefined || o.longitude !== undefined,
  )
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsEnum(LocationSource)
  locationSource?: LocationSource;
}
