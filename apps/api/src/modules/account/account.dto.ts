import { Type } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from "class-validator";

export class AddressDto {
  @IsOptional() @IsString() @MaxLength(40) label?: string;
  @IsString() @MinLength(1) @MaxLength(60) firstName!: string;
  @IsString() @MinLength(1) @MaxLength(60) lastName!: string;
  @IsString() @MinLength(3) @MaxLength(120) line1!: string;
  @IsOptional() @IsString() @MaxLength(120) line2?: string;
  @IsString() @MinLength(1) @MaxLength(80) city!: string;
  @IsOptional() @IsString() @MaxLength(80) state?: string;
  @IsString() @MinLength(2) @MaxLength(20) postalCode!: string;
  @IsString() @Length(2, 2) country!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() isDefaultShipping?: boolean;
  @IsOptional() @Type(() => Boolean) @IsBoolean() isDefaultBilling?: boolean;
}
