import type { FC } from "react";

export type BounceCardsProps = {
  className?: string;
  images?: string[];
  containerWidth?: number;
  containerHeight?: number;
  animationDelay?: number;
  animationStagger?: number;
  easeType?: string;
  transformStyles?: string[];
  enableHover?: boolean;
  hoverPushOffset?: number;
};

declare const BounceCards: FC<BounceCardsProps>;
export default BounceCards;
