import type { SceneId } from '../types/game';
import type { SceneBuilder } from './sceneContext';
import { buildPlatformScene } from './platform';
import { buildHellstoneScene } from './hellstone';
import { buildOfficeScene } from './office';
import { buildMallScene } from './mall';
import { buildGarageScene } from './garage';
import { buildInfirmaryScene } from './infirmary';
import { buildSchoolBbqScene } from './schoolBbq';
import { buildZigzagScene } from './zigzag';
import { buildParkLotScene } from './parkLot';
import { buildHospitalScene } from './hospital';
import { buildAirportScene } from './airport';
import { buildWaterparkScene } from './waterpark';
import { buildConvenienceScene } from './convenience';
import { buildSubwayScene } from './subway';
import { buildStudioScene } from './studio';
import { buildCaveScene } from './cave';
import { buildBackyardScene } from './backyard';

export const SCENE_BUILDERS: Record<SceneId, SceneBuilder> = {
  platform: buildPlatformScene,
  hellstone: buildHellstoneScene,
  office: buildOfficeScene,
  mall: buildMallScene,
  garage: buildGarageScene,
  infirmary: buildInfirmaryScene,
  school_bbq: buildSchoolBbqScene,
  zigzag: buildZigzagScene,
  park_lot: buildParkLotScene,
  hospital: buildHospitalScene,
  airport: buildAirportScene,
  waterpark: buildWaterparkScene,
  convenience: buildConvenienceScene,
  subway: buildSubwayScene,
  studio: buildStudioScene,
  cave: buildCaveScene,
  backyard: buildBackyardScene,
};
