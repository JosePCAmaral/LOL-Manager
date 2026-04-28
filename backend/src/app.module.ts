import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CountryModule } from './country/country.module';
import { LeagueModule } from './league/league.module';
import { LeagueStageModule } from './league-stage/league-stage.module';
import { ManagerHistoryModule } from './manager-history/manager-history.module';
import { MatchModule } from './match/match.module';
import { MatchDraftModule } from './match-draft/match-draft.module';
import { MatchEventModule } from './match-event/match-event.module';
import { PlayerModule } from './player/player.module';
import { SaveGameModule } from './save-game/save-game.module';
import { TeamModule } from './team/team.module';
import { TeamRivalsModule } from './team-rivals/team-rivals.module';
import { TeamTrophiesModule } from './team-trophies/team-trophies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'lol_manager',
      autoLoadEntities: true,
      synchronize: false,
      logging: false,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
    CountryModule,
    LeagueModule,
    LeagueStageModule,
    ManagerHistoryModule,
    MatchModule,
    MatchDraftModule,
    MatchEventModule,
    PlayerModule,
    SaveGameModule,
    TeamModule,
    TeamRivalsModule,
    TeamTrophiesModule,
  ],
})
export class AppModule {}
