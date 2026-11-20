import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { SupportService } from "./support.service";
import { CurrentUser } from "../../common/decorators";
import { AuthUser } from "../../common/types";

class CreateTicketDto {
  @IsString() @MinLength(3) @MaxLength(160) subject!: string;
  @IsString() @MinLength(10) @MaxLength(4000) description!: string;
  @IsOptional() @IsString() orderId?: string;
  @IsOptional() @IsIn(["LOW", "NORMAL", "HIGH", "URGENT"]) priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

class MessageDto {
  @IsString() @MinLength(1) @MaxLength(4000) body!: string;
}

@ApiTags("support")
@ApiCookieAuth("ds_session")
@Controller("support/tickets")
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.support.listForCustomer(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.support.create(user, dto);
  }

  @Get(":id")
  detail(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.support.detailForCustomer(user.id, id);
  }

  @Post(":id/messages")
  reply(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: MessageDto) {
    return this.support.addCustomerMessage(user, id, dto.body);
  }
}
