export type Pillar = {
  width: number;
  height: number;
  startX: number;
  startY: number;
};

export type ObstacleType = {
  top: Pillar;
  bottom: Pillar;
  hit: boolean;
};
